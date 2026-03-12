import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateCertificate(studentName: string, courseName: string, date: string) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 Landscape
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    
    // Draw Border
    page.drawRectangle({
        x: 20, y: 20, width: width - 40, height: height - 40,
        borderColor: rgb(0.18, 0.49, 0.2), // primary color (#2E7D32) approx
        borderWidth: 10,
    });
    
    page.drawText('Certificate of Completion', {
        x: width / 2 - 250, y: height - 150,
        size: 42, font: fontBold, color: rgb(0.18, 0.49, 0.2)
    });
    
    page.drawText('This is to certify that', {
        x: width / 2 - 120, y: height - 230,
        size: 24, font
    });
    
    page.drawText(studentName, {
        x: width / 2 - (studentName.length * 9), y: height - 300,
        size: 36, font: fontBold
    });
    
    page.drawText('has successfully completed the course', {
        x: width / 2 - 180, y: height - 370,
        size: 20, font
    });
    
    page.drawText(courseName, {
        x: width / 2 - (courseName.length * 8), y: height - 440,
        size: 28, font: fontBold, color: rgb(0.18, 0.49, 0.2)
    });
    
    page.drawText(`Date: ${date}`, {
        x: 100, y: 100, size: 16, font
    });
    
    page.drawText('FarmWise Education', {
        x: width - 250, y: 100, size: 16, font: fontBold
    });
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${courseName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_certificate.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function CertificateButton({ studentName, courseName, completedAt }: { studentName: string, courseName: string, completedAt: string }) {
    return (
        <button 
           onClick={() => generateCertificate(studentName, courseName, completedAt)}
           className="px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary/90 transition font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
        >
            Download Certificate
        </button>
    );
}
