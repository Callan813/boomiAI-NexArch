"""
damage_verifier.py

High-accuracy damage verification using:
- Structural dissimilarity (SSIM)
- Color differences (ΔE in LAB space)
- Edge / texture changes
- Weighted fusion & heatmap visualization
"""

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from skimage import exposure, filters
from skimage.color import rgb2lab
import matplotlib.pyplot as plt
import os

# =========================
# Preprocessing
# =========================
def preprocess(img: np.ndarray, size=(512, 512)) -> np.ndarray:
    """Resize, denoise, normalize image to [0,1]."""
    # Ensure input is uint8
    if img.dtype != np.uint8:
        img = (img * 255).astype(np.uint8)
    
    img = cv2.resize(img, size, interpolation=cv2.INTER_AREA)
    img = cv2.fastNlMeansDenoisingColored(img, None, 5, 5, 7, 21)
    return img.astype(np.float32) / 255.0


# =========================
# Structural Difference (SSIM)
# =========================
def ssim_diff(ref: np.ndarray, test: np.ndarray, mask: np.ndarray = None) -> np.ndarray:
    ref_gray = cv2.cvtColor((ref * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY)
    test_gray = cv2.cvtColor((test * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY)
    score, diff = ssim(ref_gray, test_gray, full=True, data_range=255)
    diff = 1 - diff  # convert similarity to dissimilarity
    diff = (diff - diff.min()) / (np.ptp(diff) + 1e-6)
    return apply_mask(diff, mask)


# =========================
# Color Difference (ΔE in LAB)
# =========================
def deltaE_map(ref: np.ndarray, test: np.ndarray, mask: np.ndarray = None) -> np.ndarray:
    ref_lab = rgb2lab(ref)
    test_lab = rgb2lab(test)
    dE = np.linalg.norm(ref_lab - test_lab, axis=-1)
    dE_norm = (dE - dE.min()) / (np.ptp(dE) + 1e-6)
    return apply_mask(dE_norm, mask)


# =========================
# Edge / Texture Differences
# =========================
def edge_diff(ref: np.ndarray, test: np.ndarray, mask: np.ndarray = None) -> np.ndarray:
    ref_edges = filters.sobel(cv2.cvtColor((ref * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY))
    test_edges = filters.sobel(cv2.cvtColor((test * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY))
    diff = np.abs(ref_edges - test_edges)
    diff = (diff - diff.min()) / (np.ptp(diff) + 1e-6)
    return apply_mask(diff, mask)


# =========================
# Masking Helper
# =========================
def apply_mask(arr: np.ndarray, mask: np.ndarray = None) -> np.ndarray:
    if mask is None:
        return arr.astype(np.float32)
    mask = cv2.resize(mask.astype(np.uint8), arr.shape[::-1])  # ensure same size
    mask = mask.astype(np.float32) / 255.0
    return (arr * mask).astype(np.float32)


# =========================
# Cue Fusion
# =========================
def fuse_cues(ssim_dissim: np.ndarray, dE: np.ndarray, edge_delta: np.ndarray, mask: np.ndarray = None) -> np.ndarray:
    # Weighted fusion (tweakable)
    w_ssim, w_de, w_edge = 0.45, 0.35, 0.20
    fused = w_ssim * ssim_dissim + w_de * dE + w_edge * edge_delta
    fused = (fused - fused.min()) / (np.ptp(fused) + 1e-6)
    fused = exposure.equalize_adapthist(fused, clip_limit=0.02)
    fused = (fused - fused.min()) / (np.ptp(fused) + 1e-6)
    fused = apply_mask(fused, mask)
    return fused.astype(np.float32)


# =========================
# Visualization
# =========================
def visualize_results(ref: np.ndarray, test: np.ndarray, fused: np.ndarray, save_path="damage_result.png"):
    plt.figure(figsize=(18, 6))
    
    plt.subplot(1, 4, 1)
    # Convert from BGR to RGB and handle float/int properly
    if ref.dtype == np.float32:
        ref_display = cv2.cvtColor((ref * 255).astype(np.uint8), cv2.COLOR_BGR2RGB)
    else:
        ref_display = cv2.cvtColor(ref, cv2.COLOR_BGR2RGB)
    plt.imshow(ref_display)
    plt.title("Before (Reference)", fontsize=14, fontweight='bold')
    plt.axis("off")

    plt.subplot(1, 4, 2)
    # Convert from BGR to RGB and handle float/int properly
    if test.dtype == np.float32:
        test_display = cv2.cvtColor((test * 255).astype(np.uint8), cv2.COLOR_BGR2RGB)
    else:
        test_display = cv2.cvtColor(test, cv2.COLOR_BGR2RGB)
    plt.imshow(test_display)
    plt.title("After (Test)", fontsize=14, fontweight='bold')
    plt.axis("off")

    plt.subplot(1, 4, 3)
    # Create a more interpretable heatmap
    # Apply threshold to highlight significant damage areas
    damage_threshold = 0.3
    enhanced_fused = np.copy(fused)
    enhanced_fused[enhanced_fused < damage_threshold] = 0
    
    # Use a more interpretable colormap
    im1 = plt.imshow(enhanced_fused, cmap="YlOrRd", vmin=0, vmax=1)
    plt.colorbar(im1, label='Damage Intensity', shrink=0.8)
    plt.title("Damage Heatmap\n(Filtered)", fontsize=14, fontweight='bold')
    plt.axis("off")
    
    plt.subplot(1, 4, 4)
    # Create overlay of damage on the after image
    if test.dtype == np.float32:
        overlay_base = (test * 255).astype(np.uint8)
    else:
        overlay_base = test.copy()
    
    # Create colored damage overlay
    damage_colored = plt.cm.Reds(enhanced_fused)[:, :, :3]  # Get RGB from colormap
    damage_colored = (damage_colored * 255).astype(np.uint8)
    
    # Blend the damage overlay with the original image
    alpha = 0.6
    blended = cv2.addWeighted(
        cv2.cvtColor(overlay_base, cv2.COLOR_BGR2RGB), 
        1-alpha, 
        damage_colored, 
        alpha, 
        0
    )
    
    plt.imshow(blended)
    plt.title("Damage Overlay\n(Red = Damage)", fontsize=14, fontweight='bold')
    plt.axis("off")
    plt.axis("off")

    plt.tight_layout()
    plt.savefig(save_path, dpi=200)
    plt.close()


# =========================
# Main Pipeline
# =========================
def verify_damage(reference_path: str, test_path: str, mask_path: str = None, save_path="damage_result.png") -> np.ndarray:
    ref = cv2.imread(reference_path)
    test = cv2.imread(test_path)

    ref = preprocess(ref)
    test = preprocess(test)

    mask = cv2.imread(mask_path, 0) if mask_path else None

    ssim_dissim = ssim_diff(ref, test, mask)
    dE = deltaE_map(ref, test, mask)
    edge_delta = edge_diff(ref, test, mask)

    fused = fuse_cues(ssim_dissim, dE, edge_delta, mask)

    visualize_results(ref, test, fused, save_path)
    return fused



if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Verify damage between two images")
    parser.add_argument("--before", type=str, required=True, help="Path to BEFORE image")
    parser.add_argument("--after", type=str, required=True, help="Path to AFTER image")
    parser.add_argument("--outdir", type=str, required=True, help="Output directory to save results")
    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    # Only generate and save damage_result.png (side-by-side visualization)
    result_path = os.path.join(args.outdir, "damage_result.png")
    verify_damage(args.before, args.after, save_path=result_path)
    print(f"[INFO] Side-by-side damage result saved at {result_path}")

    # =========================
    # Overlay Working Code (from overlayworkingcode.txt)
    # =========================
    import cv2
    import numpy as np
    import os
    import argparse
    from skimage.metrics import structural_similarity as ssim
    from skimage.color import rgb2lab, deltaE_cie76
    from skimage import filters

    def preprocess(img, size=(256, 256)):
        img = cv2.resize(img, size, interpolation=cv2.INTER_AREA)
        return img

    def compute_ssim(ref, test):
        ref_gray = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
        test_gray = cv2.cvtColor(test, cv2.COLOR_BGR2GRAY)
        score, diff = ssim(ref_gray, test_gray, full=True)
        return 1 - diff  # dissimilarity map

    def compute_color_diff(ref, test):
        ref_lab = rgb2lab(ref)
        test_lab = rgb2lab(test)
        deltaE = deltaE_cie76(ref_lab, test_lab)
        return deltaE / (deltaE.max() + 1e-6)

    def compute_edge_diff(ref, test):
        ref_edges = filters.sobel(cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY))
        test_edges = filters.sobel(cv2.cvtColor(test, cv2.COLOR_BGR2GRAY))
        return np.abs(ref_edges - test_edges)

    def fuse_cues(ssim_map, color_diff, edge_diff, mask=None):
        ssim_norm = (ssim_map - np.min(ssim_map)) / (np.ptp(ssim_map) + 1e-6)
        color_norm = (color_diff - np.min(color_diff)) / (np.ptp(color_diff) + 1e-6)
        edge_norm = (edge_diff - np.min(edge_diff)) / (np.ptp(edge_diff) + 1e-6)

        fused = 0.4 * ssim_norm + 0.4 * color_norm + 0.2 * edge_norm

        # Adaptive threshold
        thresh = fused > (0.5 * fused.max())

        # Morphological cleanup
        kernel = np.ones((3, 3), np.uint8)
        clean = cv2.morphologyEx(thresh.astype(np.uint8), cv2.MORPH_OPEN, kernel, iterations=2)
        clean = cv2.morphologyEx(clean, cv2.MORPH_CLOSE, kernel, iterations=2)

        if mask is not None:
            clean = clean * mask.astype(np.uint8)

        return clean.astype(np.float32)

    def visualize_damage(before, after, damage_mask, alpha=0.5):
        heatmap = cv2.applyColorMap((damage_mask * 255).astype(np.uint8), cv2.COLORMAP_JET)
        heatmap[damage_mask < 0.3] = (0, 0, 0)
        overlay = cv2.addWeighted(after, 1 - alpha, heatmap, alpha, 0)
        return overlay

    def generate_overlay(before_path, after_path, outdir="outputs/case_001"):
        os.makedirs(outdir, exist_ok=True)

        ref = cv2.imread(before_path)
        test = cv2.imread(after_path)
        if ref is None or test is None:
            raise ValueError("Could not read one of the input images. Check file paths.")

        ref = preprocess(ref)
        test = preprocess(test)

        ssim_map_val = compute_ssim(ref, test)
        color_diff = compute_color_diff(ref, test)
        edge_delta = compute_edge_diff(ref, test)

        damage_mask = fuse_cues(ssim_map_val, color_diff, edge_delta)
        overlay = visualize_damage(ref, test, damage_mask)

        overlay_path = os.path.join(outdir, "overlay.png")
        cv2.imwrite(overlay_path, overlay)
        print(f"[OK] Overlay saved at {overlay_path}")

# At the bottom of damage_verifier.py

def generate_overlay(before_path, after_path, outdir="outputs/case_001"):
    """Generate overlay visualization of damage detection."""
    os.makedirs(outdir, exist_ok=True)

    ref = cv2.imread(before_path)
    test = cv2.imread(after_path)
    if ref is None or test is None:
        raise ValueError("Could not read one of the input images. Check file paths.")

    ref = preprocess(ref)
    test = preprocess(test)

    ssim_map_val = compute_ssim(ref, test)
    color_diff = compute_color_diff(ref, test)
    edge_delta = compute_edge_diff(ref, test)

    damage_mask = fuse_cues(ssim_map_val, color_diff, edge_delta)
    overlay = visualize_damage(ref, test, damage_mask)

    overlay_path = os.path.join(outdir, "overlay.png")
    cv2.imwrite(overlay_path, overlay)
    print(f"[OK] Overlay saved at {overlay_path}")
    return overlay_path

def compute_ssim(ref, test):
    """Compute SSIM dissimilarity map."""
    ref_gray = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
    test_gray = cv2.cvtColor(test, cv2.COLOR_BGR2GRAY)
    score, diff = ssim(ref_gray, test_gray, full=True, data_range=255)
    return 1 - diff  # dissimilarity map

def compute_color_diff(ref, test):
    """Compute color difference using deltaE."""
    ref_lab = rgb2lab(ref)
    test_lab = rgb2lab(test)
    deltaE = np.linalg.norm(ref_lab - test_lab, axis=-1)
    return deltaE / (deltaE.max() + 1e-6)

def compute_edge_diff(ref, test):
    """Compute edge difference."""
    ref_edges = filters.sobel(cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY))
    test_edges = filters.sobel(cv2.cvtColor(test, cv2.COLOR_BGR2GRAY))
    return np.abs(ref_edges - test_edges)

def fuse_cues(ssim_map, color_diff, edge_diff, mask=None):
    """Fuse different cues into damage mask."""
    ssim_norm = (ssim_map - np.min(ssim_map)) / (np.ptp(ssim_map) + 1e-6)
    color_norm = (color_diff - np.min(color_diff)) / (np.ptp(color_diff) + 1e-6)
    edge_norm = (edge_diff - np.min(edge_diff)) / (np.ptp(edge_diff) + 1e-6)

    fused = 0.4 * ssim_norm + 0.4 * color_norm + 0.2 * edge_norm

    # Adaptive threshold
    thresh = fused > (0.5 * fused.max())

    # Morphological cleanup
    kernel = np.ones((3, 3), np.uint8)
    clean = cv2.morphologyEx(thresh.astype(np.uint8), cv2.MORPH_OPEN, kernel, iterations=2)
    clean = cv2.morphologyEx(clean, cv2.MORPH_CLOSE, kernel, iterations=2)

    if mask is not None:
        clean = clean * mask.astype(np.uint8)

    return clean.astype(np.float32)

def visualize_damage(before, after, damage_mask, alpha=0.5):
    """Visualize damage as overlay."""
    # Ensure inputs are uint8
    if before.dtype == np.float32:
        before = (before * 255).astype(np.uint8)
    if after.dtype == np.float32:
        after = (after * 255).astype(np.uint8)
    
    heatmap = cv2.applyColorMap((damage_mask * 255).astype(np.uint8), cv2.COLORMAP_JET)
    heatmap[damage_mask < 0.3] = (0, 0, 0)
    overlay = cv2.addWeighted(after, 1 - alpha, heatmap, alpha, 0)
    return overlay

def verify_damage_with_json(before_path, after_path, outdir="outputs"):
    """
    Runs your full OpenCV pipeline and returns JSON result.
    """
    os.makedirs(outdir, exist_ok=True)
    
    try:
        # Generate side-by-side damage result
        result_path = os.path.join(outdir, "damage_result.png")
        fused = verify_damage(before_path, after_path, save_path=result_path)

        # Generate overlay visualization
        overlay_path = generate_overlay(before_path, after_path, outdir=outdir)

        # Example severity metric
        severity = float(fused.mean() * 100)

        # More reasonable threshold - even small differences should be flagged
        damage_threshold = 0.5  # Much lower and more sensitive threshold
        
        result = {
            "is_damaged": severity > damage_threshold,
            "damage_severity": severity,
            "overlay_path": overlay_path
        }

        return result
        
    except Exception as e:
        return {
            "is_damaged": False,
            "damage_severity": 0.0,
            "overlay_path": None,
            "error": str(e)
        }
