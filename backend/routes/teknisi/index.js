const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireTeknisi } = require('../../middleware/auth');
const { listReports, getReportById, updateReportStatus, updateReportImages, deleteReport } = require('../../db');

// Import Cloudinary upload
const { upload } = require('../../config/cloudinary');

const router = express.Router();

// No need for URL normalization with Cloudinary (returns full URLs)

// List reports (teknisi view)
router.get('/reports', authenticateToken, requireTeknisi, async (req, res) => {
  try {
    const { search } = req.query;
    let rows = await listReports();
    // No need to normalize URLs - Cloudinary returns full URLs

    if (search) {
      const term = search.toLowerCase();
      rows = rows.filter(r => {
        const id = (r.id || '').toLowerCase();
        const namaPelapor = (r.email_pelapor || '').toLowerCase();
        const namaBarang = (r.nama_barang || '').toLowerCase();
        const unit = (r.unit || '').toLowerCase();
        const deskripsi = (r.deskripsi || '').toLowerCase();
        const status = (r.status || '').toLowerCase();
        const tanggal = (r.tanggal || '').toLowerCase();

        return id.includes(term) ||
               namaPelapor.includes(term) ||
               namaBarang.includes(term) ||
               unit.includes(term) ||
               deskripsi.includes(term) ||
               status.includes(term) ||
               tanggal.includes(term);
      });
    }

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

// Get single report (teknisi view)
router.get('/reports/:id', authenticateToken, requireTeknisi, async (req, res) => {
  try {
    const row = await getReportById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Report not found' });
    // Return report as-is (Cloudinary URLs are full URLs)
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get report' });
  }
});

// Delete report (teknisi)
router.delete('/reports/:id', authenticateToken, requireTeknisi, async (req, res) => {
  try {
    await deleteReport(req.params.id);
    res.json({ ok: true, message: 'Report deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Update report status (teknisi only)
router.put('/reports/:id/status',
  authenticateToken,
  requireTeknisi,
  [
    body('status').isIn(['To-Do', 'In Progress', 'Done']).withMessage('Invalid status value')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const { status } = req.body;
      await updateReportStatus(req.params.id, status);
      res.json({ ok: true, message: 'Status updated successfully' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
);

// Upload images for a report (teknisi only) - fill empty slots, then overwrite with rotation
router.post('/reports/:id/images', authenticateToken, requireTeknisi, upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files || [];
    console.log(`Files received: ${files.length}`);
    
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const report = await getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const urls = [report.image_url || null, report.image_url2 || null, report.image_url3 || null];
    // Cloudinary returns file.path as secure URL
    const filenames = files.map(f => f.path);
    
    console.log(`Current slots: ${JSON.stringify(urls)}`);
    console.log(`New files: ${JSON.stringify(filenames)}`);
    
    // Count empty slots
    const emptySlots = [];
    for (let i = 0; i < 3; i++) {
      if (!urls[i]) emptySlots.push(i);
    }
    console.log(`Empty slots: ${emptySlots.length} at positions ${emptySlots}`);
    
    if (emptySlots.length > 0) {
      // Fill empty slots first
      let fileIdx = 0;
      for (let i = 0; i < emptySlots.length && fileIdx < filenames.length; i++) {
        const slotIdx = emptySlots[i];
        urls[slotIdx] = filenames[fileIdx++];
        console.log(`Filled slot ${slotIdx+1} with file ${fileIdx}`);
      }
      
      // If still have files, overwrite from slot 0 with rotation
      let slotIdx = 0;
      while (fileIdx < filenames.length) {
        urls[slotIdx] = filenames[fileIdx++];
        console.log(`Overwrite slot ${slotIdx+1} with file ${fileIdx}`);
        slotIdx = (slotIdx + 1) % 3;
      }
    } else {
      // All slots full, find oldest file to replace (rotate through slots)
      // Simple approach: extract timestamp from filename and find oldest
      const getTimestamp = (url) => {
        if (!url) return 0;
        const match = url.match(/\/(\d+)_/);
        return match ? parseInt(match[1], 10) : 0;
      };
      
      const timestamps = urls.map(getTimestamp);
      console.log(`Timestamps: ${JSON.stringify(timestamps)}`);
      
      // Replace files starting from oldest slot
      for (let i = 0; i < filenames.length && i < 3; i++) {
        const oldestIdx = timestamps.indexOf(Math.min(...timestamps.filter(t => t > 0)));
        if (oldestIdx >= 0) {
          urls[oldestIdx] = filenames[i];
          timestamps[oldestIdx] = Date.now(); // Update to current timestamp
          console.log(`Replaced oldest slot ${oldestIdx+1} with file ${i+1}`);
        } else {
          // Fallback to simple rotation
          urls[i] = filenames[i];
          console.log(`Overwrite slot ${i+1} with file ${i+1}`);
        }
      }
    }
    
    console.log(`Final slots: ${JSON.stringify(urls)}`);
    await updateReportImages(req.params.id, urls);
    res.json({ ok: true, message: 'Images uploaded', urls });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Replace single image slot (teknisi only)
router.post('/reports/:id/images/:slot', authenticateToken, requireTeknisi, upload.single('image'), async (req, res) => {
  try {
    const slot = parseInt(req.params.slot, 10);
    if (![1, 2, 3].includes(slot)) {
      return res.status(400).json({ error: 'Slot harus 1-3' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const report = await getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const urls = [report.image_url, report.image_url2, report.image_url3];
    // Cloudinary returns file.path as secure URL
    urls[slot - 1] = req.file.path;
    await updateReportImages(req.params.id, urls);
    res.json({ ok: true, message: 'Image replaced', urls });
  } catch (e) {
    res.status(500).json({ error: 'Failed to replace image' });
  }
});

// DELETE /api/teknisi/reports/:id/images/:slot - Delete image by slot
router.delete('/reports/:id/images/:slot', authenticateToken, requireTeknisi, async (req, res) => {
  try {
    const slot = parseInt(req.params.slot, 10);
    if (slot < 1 || slot > 3) {
      return res.status(400).json({ error: 'Slot must be 1, 2, or 3' });
    }

    const report = await getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const urls = [report.image_url, report.image_url2, report.image_url3];
    urls[slot - 1] = null; // Set slot to null (delete)
    await updateReportImages(req.params.id, urls);
    res.json({ ok: true, message: 'Image deleted', urls });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
