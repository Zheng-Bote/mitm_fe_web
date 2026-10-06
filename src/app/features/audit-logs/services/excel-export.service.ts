import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AuditLogEntry } from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  async exportReport(
    logs: AuditLogEntry[],
    jobName: string,
    topic: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mitm2 Admin Frontend';
    workbook.created = new Date();

    const subTitleStr = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()} ${topic ? topic : ''}`.trim();

    // --- Sheet 1: Batch-Uploads ---
    const sheet1 = workbook.addWorksheet('Batch-Uploads');
    this.addHeader(sheet1, 'Batch-Uploads', subTitleStr, 2);
    
    sheet1.getRow(3).values = ['Timestamp', 'Message'];
    sheet1.getRow(3).font = { bold: true };
    sheet1.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };

    // --- Sheet 2: Upload-Report ---
    const sheet2 = workbook.addWorksheet('Upload-Report');
    this.addHeader(sheet2, 'Upload-Report', subTitleStr, 7);
    
    sheet2.getRow(3).values = [
      'Timestamp', 'Records Total', 'Records Added', 'Records Updated', 
      'Records Skipped', 'Records Rejected', 'Errors'
    ];
    sheet2.getRow(3).font = { bold: true };
    sheet2.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };

    // Regex extractors
    const totalRe = /Records Total\s*[:=]\s*(\d+)/i;
    const addedRe = /Records Added\s*[:=]\s*(\d+)/i;
    const updatedRe = /Records Updated\s*[:=]\s*(\d+)/i;
    const skippedRe = /Records Skipped\s*[:=]\s*(\d+)/i;
    const rejectedRe = /Records Rejected\s*[:=]\s*(\d+)/i;
    const errorsRe = /Errors\s*[:=]\s*(\d+)/i;

    let sumAdded = 0, sumUpdated = 0, sumSkipped = 0, sumRejected = 0, sumErrors = 0;
    
    let row1Idx = 4;
    let row2Idx = 4;

    for (const log of logs) {
      const logDate = new Date(log.ts);
      if (logDate < startDate || logDate > endDate) continue;
      
      if (jobName && !log.component.toLowerCase().includes(jobName.toLowerCase())) continue;
      
      let msg = log.message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); // strip control chars
      if (topic && !msg.toLowerCase().includes(topic.toLowerCase())) continue;

      let excelMsg = msg;
      if (excelMsg.length > 32700) {
        excelMsg = excelMsg.substring(0, 32700) + '... (truncated)';
      }

      // Add to Batch-Uploads
      sheet1.getRow(row1Idx++).values = [log.ts, excelMsg];

      // Parse for Upload-Report
      const matchTotal = msg.match(totalRe);
      const matchAdded = msg.match(addedRe);
      const matchUpdated = msg.match(updatedRe);
      const matchSkipped = msg.match(skippedRe);
      const matchRejected = msg.match(rejectedRe);
      const matchErrors = msg.match(errorsRe);

      const isRawResponse = /Response:/i.test(msg) && (/Upload \| Target:/i.test(msg) || /CORITY_SAAS/i.test(msg));

      if (!isRawResponse && (matchTotal || matchAdded || matchUpdated || matchSkipped || matchRejected || matchErrors)) {
        const added = matchAdded ? parseInt(matchAdded[1], 10) : 0;
        const updated = matchUpdated ? parseInt(matchUpdated[1], 10) : 0;
        const skipped = matchSkipped ? parseInt(matchSkipped[1], 10) : 0;
        const rejected = matchRejected ? parseInt(matchRejected[1], 10) : 0;
        const errors = matchErrors ? parseInt(matchErrors[1], 10) : 0;
        
        sumAdded += added;
        sumUpdated += updated;
        sumSkipped += skipped;
        sumRejected += rejected;
        sumErrors += errors;

        const total = matchTotal ? parseInt(matchTotal[1], 10) : (added + updated + skipped + rejected + errors);

        const rowValues: any[] = [log.ts, total, null, null, null, null, null];
        if (matchAdded) rowValues[2] = added;
        if (matchUpdated) rowValues[3] = updated;
        if (matchSkipped) rowValues[4] = skipped;
        if (matchRejected) rowValues[5] = rejected;
        if (matchErrors) rowValues[6] = errors;

        sheet2.getRow(row2Idx++).values = rowValues;
      }
    }

    // Add Sums to Upload-Report
    const lastDataRow = row2Idx > 4 ? row2Idx - 1 : 4;
    const sumHeaderRow = sheet2.getRow(3);
    
    sheet2.getCell('I3').value = 'Records Total';
    sheet2.getCell('I4').value = { formula: `SUM(B4:B${lastDataRow})`, date1904: false };
    
    sheet2.getCell('J3').value = 'Records Added';
    sheet2.getCell('J4').value = { formula: `SUM(C4:C${lastDataRow})`, date1904: false };
    
    sheet2.getCell('K3').value = 'Records Updated';
    sheet2.getCell('K4').value = { formula: `SUM(D4:D${lastDataRow})`, date1904: false };
    
    sheet2.getCell('L3').value = 'Records Skipped';
    sheet2.getCell('L4').value = { formula: `SUM(E4:E${lastDataRow})`, date1904: false };
    
    sheet2.getCell('M3').value = 'Records Rejected';
    sheet2.getCell('M4').value = { formula: `SUM(F4:F${lastDataRow})`, date1904: false };
    
    sheet2.getCell('N3').value = 'Errors';
    sheet2.getCell('N4').value = { formula: `SUM(G4:G${lastDataRow})`, date1904: false };

    // Format Sum Headers
    ['I3', 'J3', 'K3', 'L3', 'M3', 'N3'].forEach(cell => {
      sheet2.getCell(cell).font = { bold: true };
      sheet2.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
    });

    // --- Sheet 3: Chart (Statistics Summary) ---
    const sheet3 = workbook.addWorksheet('Chart');
    this.addHeader(sheet3, 'Upload Statistics Summary', subTitleStr, 2);
    
    sheet3.getRow(3).values = ['Category', 'Count'];
    sheet3.getRow(3).font = { bold: true };
    sheet3.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };

    sheet3.getRow(4).values = ['Records Added', sumAdded];
    sheet3.getRow(5).values = ['Records Updated', sumUpdated];
    sheet3.getRow(6).values = ['Records Skipped', sumSkipped];
    sheet3.getRow(7).values = ['Records Rejected', sumRejected];
    sheet3.getRow(8).values = ['Errors', sumErrors];

    // Note: ExcelJS does not natively support creating pie charts. We output the data so users can create their own chart.

    // Adjust column widths
    [sheet1, sheet2, sheet3].forEach(sheet => {
      sheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell!({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : Math.min(maxLength + 2, 50); // cap width
      });
    });

    // Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const d1 = startDate.toISOString().replace(/[:\-T]/g, '').slice(0, 14);
    const d2 = endDate.toISOString().replace(/[:\-T]/g, '').slice(0, 14);
    const safeTopic = topic ? `_${topic.replace(/[^a-z0-9]/gi, '')}` : '';
    const dateNow = new Date().toISOString().split('T')[0];
    
    const filename = `${dateNow}__${safeTopic}_report__${d1}-${d2}.xlsx`;
    saveAs(blob, filename);
  }

  private addHeader(sheet: ExcelJS.Worksheet, title: string, subtitle: string, mergeCols: number) {
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
    if (mergeCols > 1) {
      sheet.mergeCells(1, 1, 1, mergeCols);
    }

    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = subtitle;
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
    if (mergeCols > 1) {
      sheet.mergeCells(2, 1, 2, mergeCols);
    }
  }
}
