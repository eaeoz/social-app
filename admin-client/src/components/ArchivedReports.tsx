import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ArchivedReports.css';
import jsPDF from 'jspdf';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Report {
  reporterId: string;
  reporterEmail: string;
  reason: string;
  timestamp: string;
}

interface ArchivedReport {
  reportedUserId: string;
  reportedUserEmail: string;
  reportedUsername: string;
  totalReports: number;
  firstReportDate: string;
  lastReportDate: string;
  transferredAt: string;
  batchNumber: number;
  totalBatches: number;
  reports: Report[];
}

const ArchivedReports: React.FC = () => {
  const [archivedReports, setArchivedReports] = useState<ArchivedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<ArchivedReport | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchArchivedReports();
  }, []);

  const fetchArchivedReports = async (search = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/archived-reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search }
      });
      setArchivedReports(response.data.archivedReports);
    } catch (error) {
      console.error('Failed to fetch archived reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArchivedReports(searchTerm);
  };

  const viewReport = (report: ArchivedReport) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const generatePDF = async (report: ArchivedReport) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text('Archived Report Summary', pageWidth / 2, 25, { align: 'center' });
    
    // Reported User Information (Compact)
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Reported User:', 15, 52);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(`${report.reportedUsername} (${report.reportedUserEmail})`, 15, 59);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${report.totalReports} Reports`, 15, 66);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${new Date(report.firstReportDate).toLocaleDateString()} - ${new Date(report.lastReportDate).toLocaleDateString()}`, 15, 72);
    
    // Line separator
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, 78, pageWidth - 15, 78);
    
    // Reports Grid - 4-4-2 layout with larger cards
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Individual Reports', 15, 88);
    
    const startY = 98;
    const cardWidth = 44; // Larger cards
    const cardHeight = 50; // Taller for multi-line text
    const marginX = 3;
    const marginY = 3;
    
    // Helper function to wrap text
    const wrapText = (text: string, maxWidth: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = pdf.getTextWidth(testLine);
        
        if (textWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    };
    
    // Calculate layout: 4-4-2
    for (let index = 0; index < Math.min(report.reports.length, 10); index++) {
      const rep = report.reports[index];
      let row, col;
      
      if (index < 4) {
        // First row: 4 cards
        row = 0;
        col = index;
      } else if (index < 8) {
        // Second row: 4 cards
        row = 1;
        col = index - 4;
      } else {
        // Third row: 2 cards (centered)
        row = 2;
        col = index - 8;
      }
      
      // Calculate X position - last row aligned to start
      const currentX = 15 + col * (cardWidth + marginX);
      
      const currentY = startY + row * (cardHeight + marginY);
      
      // Draw card background
      pdf.setDrawColor(180, 180, 180);
      pdf.setFillColor(248, 248, 248);
      pdf.roundedRect(currentX, currentY, cardWidth, cardHeight, 3, 3, 'FD');
      
      // Card header with number
      pdf.setFillColor(41, 128, 185);
      pdf.roundedRect(currentX, currentY, cardWidth, 8, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Report #${index + 1}`, currentX + cardWidth / 2, currentY + 5.5, { align: 'center' });
      
      // Profile picture placeholder (circle)
      pdf.setFillColor(220, 220, 220);
      pdf.circle(currentX + cardWidth / 2, currentY + 16, 5, 'F');
      
      // Add initials in circle
      const initials = rep.reporterEmail.charAt(0).toUpperCase();
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(initials, currentX + cardWidth / 2, currentY + 17.5, { align: 'center' });
      
      // Reporter email
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      const emailLines = wrapText(rep.reporterEmail, cardWidth - 6);
      let emailY = currentY + 25;
      emailLines.slice(0, 2).forEach(line => {
        pdf.text(line, currentX + cardWidth / 2, emailY, { align: 'center' });
        emailY += 3.5;
      });
      
      // Reason with wrapping
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reason:', currentX + 3, currentY + 34);
      pdf.setFont('helvetica', 'normal');
      const reasonLines = wrapText(rep.reason, cardWidth - 6);
      let reasonY = currentY + 38;
      reasonLines.slice(0, 2).forEach(line => {
        pdf.text(line, currentX + 3, reasonY);
        reasonY += 3.5;
      });
      
      // Date at bottom
      pdf.setFontSize(6);
      pdf.setTextColor(100, 100, 100);
      const date = new Date(rep.timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      pdf.text(date, currentX + cardWidth / 2, currentY + cardHeight - 3, { align: 'center' });
    }
    
    // Footer
    const finalY = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Generated on ${new Date().toLocaleString()}`,
      pageWidth / 2,
      finalY,
      { align: 'center' }
    );
    
    // Save PDF
    pdf.save(`archived-report-${report.reportedUsername}-${Date.now()}.pdf`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="archived-reports-loading">Loading archived reports...</div>;
  }

  return (
    <div className="archived-reports-container">
      <div className="archived-reports-header">
        <h2>📦 Archived Reports</h2>
        <p>View historical reports from previously suspended users</p>
      </div>

      <form onSubmit={handleSearch} className="archived-search-form">
        <input
          type="text"
          placeholder="Search by email or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="archived-search-input"
        />
        <button type="submit" className="archived-search-btn">
          🔍 Search
        </button>
        {searchTerm && (
          <button
            type="button"
            className="archived-clear-btn"
            onClick={() => {
              setSearchTerm('');
              fetchArchivedReports();
            }}
          >
            Clear
          </button>
        )}
      </form>

      {archivedReports.length === 0 ? (
        <div className="archived-no-reports">
          <p>No archived reports found</p>
        </div>
      ) : (
        <div className="archived-reports-list">
          {archivedReports.map((report, index) => (
            <div key={index} className="archived-report-card">
              <div className="archived-report-header">
                <h3>{report.reportedUsername}</h3>
                <span className="archived-report-count">{report.totalReports} Reports</span>
              </div>
              
              <div className="archived-report-details">
                <div className="archived-detail-row">
                  <strong>Email:</strong>
                  <span>{report.reportedUserEmail}</span>
                </div>
                <div className="archived-detail-row">
                  <strong>First Report:</strong>
                  <span>{formatDate(report.firstReportDate)}</span>
                </div>
                <div className="archived-detail-row">
                  <strong>Last Report:</strong>
                  <span>{formatDate(report.lastReportDate)}</span>
                </div>
                <div className="archived-detail-row">
                  <strong>Archived:</strong>
                  <span>{formatDate(report.transferredAt)}</span>
                </div>
              </div>

              <div className="archived-report-actions">
                <button
                  className="archived-view-btn"
                  onClick={() => viewReport(report)}
                >
                  👁️ View Details
                </button>
                <button
                  className="archived-pdf-btn"
                  onClick={() => generatePDF(report)}
                >
                  📄 Generate PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for viewing report details */}
      {showModal && selectedReport && (
        <div className="archived-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="archived-modal" onClick={(e) => e.stopPropagation()}>
            <div className="archived-modal-header">
              <h3>Report Details - {selectedReport.reportedUsername}</h3>
              <button className="archived-modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="archived-modal-body">
              <div className="archived-modal-info">
                <p><strong>Email:</strong> {selectedReport.reportedUserEmail}</p>
                <p><strong>Total Reports:</strong> {selectedReport.totalReports}</p>
                <p><strong>Date Range:</strong> {formatDate(selectedReport.firstReportDate)} - {formatDate(selectedReport.lastReportDate)}</p>
              </div>

              <h4>Individual Reports:</h4>
              <div className="archived-reports-grid">
                {selectedReport.reports.map((rep, idx) => (
                  <div key={idx} className="archived-report-item">
                    <div className="archived-report-number">#{idx + 1}</div>
                    <p><strong>Reporter:</strong> {rep.reporterEmail}</p>
                    <p><strong>Reason:</strong> {rep.reason}</p>
                    <p><strong>Date:</strong> {formatDate(rep.timestamp)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="archived-modal-footer">
              <button
                className="archived-modal-pdf-btn"
                onClick={() => {
                  generatePDF(selectedReport);
                  setShowModal(false);
                }}
              >
                📄 Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivedReports;
