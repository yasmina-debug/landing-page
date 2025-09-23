const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { jsPDF } = require("jspdf");
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON data from the request body.
app.use(bodyParser.json({ limit: '50mb' }));

// Middleware to allow cross-origin requests.
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Configure the Nodemailer transporter. You MUST use an App Password.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'yasmina@acquisit.io',
        pass: 'skxh gyya ezcl rlfj'
    }
});

// Add a GET route to serve the HTML file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ClientFile3.html'));
});

app.post('/submit-form', async (req, res) => {
    const data = req.body;

    // Add validation check here
    if (!data.clientName) {
        return res.status(400).send({ message: 'Client Name is a required field.' });
    }

    try {
        // Generate the JSON file content.
        const jsonContent = JSON.stringify(data, null, 2);
        const jsonBuffer = Buffer.from(jsonContent, 'utf-8');

        // Generate the PDF file content.
        const doc = new jsPDF();
        let yOffset = 15;
        const addText = (label, text) => {
            if (!text) return;
            doc.setFont("helvetica", "bold");
            doc.text(`${label}:`, 15, yOffset);
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(text, 180);
            doc.text(lines, 15, yOffset + 5);
            yOffset += 10 + lines.length * 5;
        };

        addText('Client Name', data.clientName);
        addText('Product/Service Description', data.productDescription);
        addText('Target Audience', data.targetAudience);
        addText('Platform Target', data.platformTarget);
        addText('Tone', data.tone);
        addText('Page Goals', data.goals);
        addText('Additional Comments', data.additionalComments);
        addText('Style Inspiration', data.styleInspiration);
        addText('Image Link', data.imageLink);

        // Add a check to ensure data.files is an array before calling forEach
        if (Array.isArray(data.files)) {
            data.files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    doc.addPage();
                    doc.setFont("helvetica", "bold");
                    doc.text(`Attached Image: ${file.name}`, 15, 15);
                    doc.addImage(file.dataUrl, file.type.split('/')[1].toUpperCase(), 15, 20, 180, 100);
                } else if (file.type === 'application/pdf') {
                    doc.addPage();
                    doc.setFont("helvetica", "bold");
                    doc.text(`Attached PDF: ${file.name}`, 15, 15);
                    doc.setFont("helvetica", "normal");
                    doc.text('This PDF file has been attached to the email.', 15, 25);
                }
            });
        }

        const pdfBuffer = doc.output('arraybuffer');

        // Prepare email attachments.
        const attachments = [
            {
                filename: 'project-data.json',
                content: jsonBuffer,
                contentType: 'application/json'
            },
            {
                filename: 'project-report.pdf',
                content: Buffer.from(pdfBuffer),
                contentType: 'application/pdf'
            }
        ];
        
        // Add a check to ensure data.files is an array before calling forEach
        if (Array.isArray(data.files)) {
            data.files.forEach(file => {
                attachments.push({
                    filename: file.name,
                    content: file.dataUrl.split(';base64,')[1],
                    encoding: 'base64'
                });
            });
        }

        const mailOptions = {
            from: 'yasmina@acquisit.io',
            to: 'yasmina@acquisit.io, tony.abichebel@acquisit.io, taima@acquisit.io',
            subject: `New Landing Page Project Submission from ${data.clientName}`,
            html: `
                <p>Hello,</p>
                <p>A new project submission has been received from ${data.clientName}.</p>
                <p><strong>Project Details:</strong></p>
                <ul>
                    <li><strong>Product Description:</strong> ${data.productDescription}</li>
                    <li><strong>Target Audience:</strong> ${data.targetAudience}</li>
                    <li><strong>Tone:</strong> ${data.tone}</li>
                    <li><strong>Page Goals:</strong> ${data.goals}</li>
                    ${data.imageLink ? `<li><strong>Image Link:</strong> ${data.imageLink}</li>` : ''}
                </ul>`,
            attachments: attachments
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send({ message: 'Error sending email.' });
            }
            console.log('Email sent:', info.response);
            res.status(200).send({ message: 'Form submitted successfully.' });
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send({ message: 'An internal server error occurred.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at https://landing-page-api-yvhj.onrender.com`);
});