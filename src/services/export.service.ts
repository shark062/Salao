import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportToCsv(data: any[], filename: string): void {
    if (!data || data.length === 0) {
      console.warn('No data available to export.');
      alert('Não há dados para exportar.');
      return;
    }

    const replacer = (key: any, value: any) => value === null ? '' : value;
    const header = Object.keys(data[0]);
    const csv = [
      header.join(','), // header row
      ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
