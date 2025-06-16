import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testApi() {
  try {
    // Read test files
    const resumeText = fs.readFileSync(path.join(__dirname, 'test-resume.txt'), 'utf-8');
    const jobText = fs.readFileSync(path.join(__dirname, 'test-job.txt'), 'utf-8');

    // Create form data
    const formData = new FormData();
    formData.append('file', Buffer.from(resumeText), {
      filename: 'resume.txt',
      contentType: 'text/plain',
    });
    formData.append('jobPosting', jobText);

    // Make API request (use port 3001)
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData as any, // Type assertion to handle FormData
      headers: formData.getHeaders() as any, // Type assertion to handle headers
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Analysis Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testApi(); 