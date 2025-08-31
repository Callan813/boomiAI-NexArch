import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with the service role key
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const AGENTS_DIR = path.resolve(process.cwd(), 'agents');
const PAYOUT_AGENT_SCRIPT = path.join(AGENTS_DIR, 'payout_agent', 'payout_agent.py');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { rental_id, user_id, amount } = req.body;

    if (!rental_id || !user_id || !amount) {
        return res.status(400).json({ error: 'Missing required fields: rental_id, user_id, and amount are required.' });
    }

    try {
        // 1. Check if a payment already exists and is completed
        const { data: existingPayment, error: existingPaymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('rental_id', rental_id)
            .eq('status', 'completed')
            .single();

        if (existingPayment) {
            return res.status(409).json({ message: 'Payment for this rental has already been processed.' });
        }
        if (existingPaymentError && existingPaymentError.code !== 'PGRST116') { // Ignore 'single row not found' error
             throw new Error(`Database query failed: ${existingPaymentError.message}`);
        }

        // 2. Call the Python payout agent
        const pythonProcess = spawn('python', [PAYOUT_AGENT_SCRIPT]);

        const agentPayload = { rental_id, user_id, amount };
        let agentResult = '';
        let agentError = '';

        pythonProcess.stdout.on('data', (data) => agentResult += data.toString());
        pythonProcess.stderr.on('data', (data) => agentError += data.toString());

        pythonProcess.stdin.write(JSON.stringify(agentPayload));
        pythonProcess.stdin.end();

        await new Promise((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('Payout agent stderr:', agentError);
                    return reject(new Error(`Payout agent failed: ${agentError}`));
                }
                resolve();
            });
        });

        const { payment_id, status } = JSON.parse(agentResult);

        // 3. The agent is expected to create the payment record.
        // Here, we just confirm and return the result.
        if (status !== 'completed') {
            throw new Error(`Payout agent returned a non-completed status: ${status}`);
        }

        res.status(200).json({ payment_id, status, message: 'Payout processed successfully.' });

    } catch (error) {
        console.error('Payout process failed:', error);
        res.status(500).json({ error: error.message });
    }
}
