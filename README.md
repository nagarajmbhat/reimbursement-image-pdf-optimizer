# Reimbursement Image-to-PDF Watermarker & Optimizer

A lightweight, modern, 100% client-side web application designed to prepare receipt and bill images for corporate reimbursement claims.

## 🚀 Key Features

1. **Multi-Format Ingestion**:
   - Accepts Apple iPhone `.heic` and `.heif` images (converted automatically via `heic2any` in-browser).
   - Accepts standard `.jpg`, `.jpeg`, `.png`, `.webp`, and mobile/desktop screenshots.

2. **Custom Corner Watermark / Stamp**:
   - Stamped on the bottom-right corner (or customizable to top-right, bottom-left, top-left).
   - High-contrast frosted glass or solid badge pill styling ensures legibility over both dark and bright receipts.
   - Quick insertion shortcuts for today's date, Employee ID, Confidential tags, etc.
   - Remembers your preferences in `localStorage`.

3. **Image Optimization & Compression**:
   - Adjustable max dimension cap (e.g. 1800px) so 48MP phone cameras don't create bloated PDFs.
   - Adjustable JPEG compression quality slider (default ~82%).

4. **Dynamic 5 MB Auto-Splitting Multi-page PDFs**:
   - Packages processed images into multi-page PDF files.
   - Monitors PDF file size in real-time: if a document reaches the threshold (e.g. 4.8 MB buffer), it automatically seals `[Your_Filename]_Part1.pdf` and starts `Part2.pdf`, continuing consecutively (`Part3.pdf`, etc.).
   - Individual download buttons for each PDF part + "Download All as ZIP" packaging.

5. **Custom PDF Filename & Automatic Numbering**:
   - Set custom names (e.g. `Petrol_Receipts_Oct2026`, `Car_Maintenance_Claim`, `WiFi_Bills_Q3`).
   - Automatically cleans illegal filename characters and appends `_Part1.pdf`, `_Part2.pdf`, etc.
   - Remembers your preferred filename in `localStorage`.

6. **100% Client-Side Privacy**:
   - Zero receipt images leave your computer or browser. All processing is done locally.

7. **100% Free & Unlimited (No Sign-up Required)**:
   - Completely free with no subscriptions, usage limits, or watermark ads. Free to host and share.



---

## 💻 How to Run & Host

### Option 1: Zero Installation (Direct Browser Open)
Double click [`index.html`](./index.html) to open in Chrome, Edge, Safari, or Firefox.

## 🏢 Supported Reimbursement Categories

Pre-configured presets and high-contrast stamps for all major corporate & MNC employee expense policies:
- **⛽ Petrol & Fuel Claims:** Fuel pump slips, diesel vouchers, CNG & EV charging receipts.
- **🚗 Car Maintenance & Servicing:** Periodic vehicle maintenance, repair bills, tyre replacement, oil change invoices.
- **👨‍✈️ Driver Salary & Allowances:** Monthly chauffeur vouchers, driver salary receipts, Fastag/toll tax logs.
- **📶 Broadband / WiFi Internet:** Monthly ISP bills (Airtel, Jio, ACT, Vodafone, Comcast, Spectrum).
- **📱 Mobile & Telephone Bills:** Postpaid mobile connection bills and data plan invoices.
- **🏢 MNC Office & WFH Allowances:** Work-from-home ergonomics, monitors, peripherals, stationery, client meals, and travel expenses for portals like **SAP Concur, Workday, Zoho Expense, Expensify, and Oracle**.

---

## 🔍 SEO & Discovery Optimizations Included
- **Keyword Meta Tags:** Targeted for *Petrol reimbursement PDF*, *Car maintenance claim*, *Driver salary receipt*, *WiFi bill PDF*, *Mobile bill reimbursement*, *HEIC to PDF*, and *auto split PDF 5MB*.
- **JSON-LD Schema Markup:** Structured `WebApplication` metadata with `BusinessApplication` classification for Google search indexing.
- **Open Graph & Twitter Cards:** Pre-formatted preview cards when sharing links on Slack, Teams, LinkedIn, or Twitter.
- **`robots.txt` & `sitemap.xml`:** Included for search engine indexing.

🌐 Live Web Application URL (GitHub Pages):
👉 https://nagarajmbhat.github.io/reimbursement-image-pdf-optimizer/


