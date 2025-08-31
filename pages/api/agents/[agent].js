import { spawn } from 'child_process';
import path from 'path';

// Define the base path to the agents directory
const AGENTS_DIR = path.resolve(process.cwd(), 'agents');

// Map agent names to their script paths
const AGENT_SCRIPTS = {
    orchestrator: path.join(AGENTS_DIR, 'orchestrator', 'orchestrator.py'),
    matching: path.join(AGENTS_DIR, 'matching_agent', 'matching_agent.py'),
    pricing: path.join(AGENTS_DIR, 'pricing_agent', 'pricing_agent.py'),
    trust: path.join(AGENTS_DIR, 'trust_agent', 'trust_agent.py'),
    verification: path.join(AGENTS_DIR, 'verification_agent', 'main.py'),
    engagement: path.join(AGENTS_DIR, 'engagement_agent', 'engagement_agent.py'),
    payout: path.join(AGENTS_DIR, 'payout_agent', 'payout_agent.py'),
};

export default function handler(req, res) {
    const { agent } = req.query;
    const scriptPath = AGENT_SCRIPTS[agent];

    if (!scriptPath) {
        return res.status(404).json({ error: `Agent '${agent}' not found.` });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    // Use a promise to handle the asynchronous Python script execution
    const runAgent = new Promise((resolve, reject) => {
        // Use 'python3' or 'python' depending on the system setup.
        // Pass data to the script via stdin for security and to handle large inputs.
        const pythonProcess = spawn('python', [scriptPath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Agent '${agent}' exited with code ${code}`);
                console.error('Stderr:', stderr);
                return reject(new Error(`Agent execution failed: ${stderr}`));
            }
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (error) {
                console.error('Failed to parse agent output as JSON:', stdout);
                reject(new Error('Invalid response from agent.'));
            }
        });
        
        pythonProcess.on('error', (err) => {
            console.error(`Failed to start agent '${agent}'`, err);
            reject(new Error('Failed to start agent process.'));
        });

        // Write the request body to the Python script's stdin
        pythonProcess.stdin.write(JSON.stringify(req.body));
        pythonProcess.stdin.end();
    });

    runAgent
        .then(result => {
            res.status(200).json(result);
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
}
