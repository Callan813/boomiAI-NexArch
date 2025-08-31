import { IncomingForm } from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client with the service role key for admin-level access
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export const config = {
    api: {
        bodyParser: false, // Disable Next.js's default body parser to handle form data
    },
};

const AGENTS_DIR = path.resolve(process.cwd(), 'agents');
const VERIFICATION_SCRIPT_PATH = path.join(AGENTS_DIR, 'verification_agent', 'main.py');

// Helper function to upload a file to Supabase Storage
const uploadFileToSupabase = async (file, rentalId) => {
    const fileContent = fs.readFileSync(file.filepath);
    const fileName = `${rentalId}/${uuidv4()}-${file.originalFilename}`;
    
    const { data, error } = await supabase.storage
        .from('damage-reports')
        .upload(fileName, fileContent, {
            contentType: file.mimetype,
            upsert: false,
        });

    if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage.from('damage-reports').getPublicUrl(data.path);
    return publicUrl;
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ error: `Form parsing failed: ${err.message}` });
        }

        const { beforeImage, afterImage } = files;
        const rental_id = Array.isArray(fields.rental_id) ? fields.rental_id[0] : fields.rental_id;
        const reporter_id = Array.isArray(fields.reporter_id) ? fields.reporter_id[0] : fields.reporter_id;
        const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;


        if (!beforeImage || !afterImage || !rental_id || !reporter_id) {
            return res.status(400).json({ error: 'Missing required fields: beforeImage, afterImage, rental_id, and reporter_id are required.' });
        }

        try {
            // 1. Upload images to Supabase Storage
            const beforeImageUrl = await uploadFileToSupabase(Array.isArray(beforeImage) ? beforeImage[0] : beforeImage, rental_id);
            const afterImageUrl = await uploadFileToSupabase(Array.isArray(afterImage) ? afterImage[0] : afterImage, rental_id);

            // 2. Call the Python verification agent
            const pythonProcess = spawn('python', [VERIFICATION_SCRIPT_PATH]);
            
            const agentPayload = {
                before_image_url: beforeImageUrl,
                after_image_url: afterImageUrl,
            };

            let agentResult = '';
            let agentError = '';

            pythonProcess.stdout.on('data', (data) => agentResult += data.toString());
            pythonProcess.stderr.on('data', (data) => agentError += data.toString());
            
            pythonProcess.stdin.write(JSON.stringify(agentPayload));
            pythonProcess.stdin.end();

            await new Promise((resolve, reject) => {
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error('Python script stderr:', agentError);
                        return reject(new Error(`Verification agent failed with exit code ${code}.`));
                    }
                    resolve();
                });
            });

            const { verification_score, damage_heatmap_url } = JSON.parse(agentResult);

            // 3. Save the report to the database
            const { data: reportData, error: dbError } = await supabase
                .from('damage_reports')
                .insert({
                    rental_id,
                    reporter_id,
                    description: description || 'Damage report',
                    image_before_url: beforeImageUrl,
                    image_after_url: afterImageUrl,
                    damage_heatmap_url,
                    verification_score,
                    verified_by_agent: true,
                    status: 'pending',
                })
                .select()
                .single();

            if (dbError) {
                throw new Error(`Database insert failed: ${dbError.message}`);
            }

            // 4. Return the final report
            res.status(200).json(reportData);

        } catch (error) {
            console.error('Damage verification process failed:', error);
            res.status(500).json({ error: error.message });
        }
    });
}
