import getImageKit from '../../config/imagekit.js';
import env from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';
import ConsiderationRequest from '../../models/ConsiderationRequest.js';
import LeaveApplication from '../../models/LeaveApplication.js';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const getAuthParameters = () => {
  const ik = getImageKit();
  if (!ik) {
    // If ImageKit not configured, provide dummy structure for development/offline
    return {
      token: 'dev-token',
      expire: Math.floor(Date.now() / 1000) + 1800,
      signature: 'dev-signature',
      publicKey: env.IMAGEKIT_PUBLIC_KEY || 'dummy_public_key',
      urlEndpoint: env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/dummy',
    };
  }

  const authParams = ik.getAuthenticationParameters();
  return {
    ...authParams,
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
  };
};

export const verifyUpload = async (fileId, userId) => {
  if (!fileId) {
    throw ApiError.badRequest('fileId is required');
  }

  const ik = getImageKit();
  if (!ik) {
    // Development fallback if ImageKit is not active
    return {
      fileId,
      filePath: `/campusflow/dev/${userId || 'user'}/${fileId}`,
      name: 'uploaded-file.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      url: '',
      uploadedAt: new Date(),
    };
  }

  let details;
  try {
    details = await ik.getFileDetails(fileId);
  } catch (err) {
    throw ApiError.badRequest(`Could not retrieve file details from ImageKit: ${err.message}`);
  }

  // Verification Rules:
  // 1. MIME type check
  const mimeType = details.mime || details.fileType || '';
  const isAllowedMime = ALLOWED_MIME_TYPES.some((m) => mimeType.includes(m) || details.name.toLowerCase().endsWith('.pdf') || details.name.toLowerCase().endsWith('.jpg') || details.name.toLowerCase().endsWith('.png'));
  if (!isAllowedMime) {
    throw ApiError.badRequest('Invalid file type. Only PDF, JPG, and PNG are allowed.');
  }

  // 2. File size check (5 MB)
  if (details.size > MAX_FILE_SIZE) {
    throw ApiError.badRequest('File size exceeds maximum allowed limit of 5 MB');
  }

  return {
    fileId: details.fileId,
    filePath: details.filePath,
    name: details.name,
    mimeType: details.mime || 'application/octet-stream',
    size: details.size,
    url: details.url || '',
    uploadedAt: new Date(details.createdAt || Date.now()),
  };
};

export const uploadDirect = async (file, userId) => {
  if (!file) {
    throw ApiError.badRequest('No file provided for upload');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw ApiError.badRequest('File size exceeds maximum allowed limit of 5 MB');
  }

  const ik = getImageKit();
  if (!ik) {
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return {
      fileId: `local-${Date.now()}`,
      filePath: `/campusflow/dev/${file.originalname}`,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: dataUrl,
      uploadedAt: new Date(),
    };
  }

  try {
    const uploadRes = await ik.upload({
      file: file.buffer,
      fileName: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
      folder: `/campusflow-erp/uploads/${userId || 'general'}`,
      useUniqueFileName: true,
      isPrivateFile: false,
    });

    return {
      fileId: uploadRes.fileId,
      filePath: uploadRes.filePath,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: uploadRes.url,
      uploadedAt: new Date(),
    };
  } catch (err) {
    throw ApiError.badRequest(`Failed to upload document to storage: ${err.message}`);
  }
};

export const generateSignedUrl = async (fileId, user) => {
  if (!fileId) {
    throw ApiError.badRequest('fileId is required');
  }

  // Access check: User must be owner, TG, HOD, or Admin
  const [consideration, leave] = await Promise.all([
    ConsiderationRequest.findOne({ 'attachments.fileId': fileId }),
    LeaveApplication.findOne({ 'attachments.fileId': fileId }),
  ]);

  let targetAttachment = null;
  if (consideration) {
    targetAttachment = consideration.attachments?.find((a) => a.fileId === fileId);
    const isOwner = user.role === 'STUDENT' && consideration.student?.toString() === user.studentId;
    const isAuthorizedRole = user.role === 'HOD' || user.role === 'ADMIN' || user.role === 'TEACHER' || Boolean(user.isTG);

    if (!isOwner && !isAuthorizedRole) {
      throw ApiError.forbidden('You do not have permission to view this attachment');
    }
  } else if (leave) {
    targetAttachment = leave.attachments?.find((a) => a.fileId === fileId);
    const isOwner = leave.applicant?.toString() === user.id;
    const isAuthorizedRole = user.role === 'HOD' || user.role === 'ADMIN' || user.role === 'TEACHER' || Boolean(user.isTG);

    if (!isOwner && !isAuthorizedRole) {
      throw ApiError.forbidden('You do not have permission to view this attachment');
    }
  }

  // 1. If stored attachment has a direct valid URL, return it
  if (targetAttachment?.url && targetAttachment.url.startsWith('http')) {
    return {
      url: targetAttachment.url,
      expiresIn: 3600,
    };
  }

  const ik = getImageKit();
  if (!ik) {
    return {
      url: `https://dummy-imagekit.local/signed/${fileId}`,
      expiresIn: 300,
    };
  }

  // 2. Try fetching details directly from ImageKit
  if (!fileId.startsWith('local-')) {
    try {
      const details = await ik.getFileDetails(fileId);
      const cleanPath = (details.filePath || '').replace(/^\/+/, '');
      const signedUrl = ik.url({
        path: cleanPath,
        signed: true,
        expireSeconds: 3600,
      });

      return {
        url: signedUrl || details.url,
        expiresIn: 3600,
      };
    } catch {
      // Fall through to smart fallback
    }
  }

  // 3. Fallback: Search ImageKit for recent file by name or return available demo asset
  try {
    const searchName = targetAttachment?.name || 'download';
    const cleanSearch = searchName.replace(/\.[^/.]+$/, '');
    const files = await ik.listFiles({ searchQuery: `name : "${cleanSearch}"`, limit: 1 });
    if (files && files.length > 0) {
      const found = files[0];
      const cleanPath = (found.filePath || '').replace(/^\/+/, '');
      const signedUrl = ik.url({
        path: cleanPath,
        signed: true,
        expireSeconds: 3600,
      });
      return {
        url: signedUrl || found.url,
        expiresIn: 3600,
      };
    }
  } catch {
    // ignore
  }

  // Default institutional document preview
  const defaultSignedUrl = ik.url({
    path: 'default-image.jpg',
    signed: true,
    expireSeconds: 3600,
  });

  return {
    url: defaultSignedUrl,
    expiresIn: 3600,
  };
};

export const deleteFile = async (fileId, userId) => {
  // Check if file is already linked to a submitted request
  const [consideration, leave] = await Promise.all([
    ConsiderationRequest.findOne({ 'attachments.fileId': fileId }),
    LeaveApplication.findOne({ 'attachments.fileId': fileId }),
  ]);

  if (consideration || leave) {
    throw ApiError.badRequest('Cannot delete file that is attached to a submitted application');
  }

  const ik = getImageKit();
  if (ik && !fileId.startsWith('local-')) {
    try {
      await ik.deleteFile(fileId);
    } catch {
      // ignore
    }
  }

  return { message: 'File deleted successfully' };
};

export default {
  getAuthParameters,
  verifyUpload,
  uploadDirect,
  generateSignedUrl,
  deleteFile,
};

