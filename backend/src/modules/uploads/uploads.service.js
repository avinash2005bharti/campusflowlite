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
      filePath: `/campusflow/dev/${userId}/${fileId}`,
      name: 'uploaded-file.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      uploadedAt: new Date(),
    };
  }

  let details;
  try {
    details = await ik.getFileDetails(fileId);
  } catch (err) {
    throw ApiError.badRequest(`Could not retrieve file details from ImageKit: ${err.message}`);
  }

  // Verification Rules per Section 9.2:
  // 1. File path must be under /campusflow/*/{userId}/
  const pathParts = (details.filePath || '').split('/');
  // Checking if userId is in the filePath
  if (!details.filePath.includes(userId)) {
    throw ApiError.forbidden('File does not belong to the authenticated user');
  }

  // 2. MIME type check
  const mimeType = details.mime || details.fileType;
  // If ImageKit reports 'non-image' or specific mime, verify extension or mime
  const isAllowedMime = ALLOWED_MIME_TYPES.some((m) => mimeType.includes(m) || details.name.toLowerCase().endsWith('.pdf') || details.name.toLowerCase().endsWith('.jpg') || details.name.toLowerCase().endsWith('.png'));
  if (!isAllowedMime) {
    throw ApiError.badRequest('Invalid file type. Only PDF, JPG, and PNG are allowed.');
  }

  // 3. File size check (5 MB)
  if (details.size > MAX_FILE_SIZE) {
    throw ApiError.badRequest('File size exceeds maximum allowed limit of 5 MB');
  }

  return {
    fileId: details.fileId,
    filePath: details.filePath,
    name: details.name,
    mimeType: details.mime || 'application/octet-stream',
    size: details.size,
    uploadedAt: new Date(details.createdAt || Date.now()),
  };
};

export const generateSignedUrl = async (fileId, user) => {
  if (!fileId) {
    throw ApiError.badRequest('fileId is required');
  }

  // Access check: User must be owner, TG, HOD, or Admin
  // Verify file association in ConsiderationRequest or LeaveApplication
  const [consideration, leave] = await Promise.all([
    ConsiderationRequest.findOne({ 'attachments.fileId': fileId }),
    LeaveApplication.findOne({ 'attachments.fileId': fileId }),
  ]);

  if (consideration) {
    const isOwner = user.role === 'STUDENT' && consideration.student.toString() === user.studentId;
    const isTG = user.isTG && consideration.tg?.toString() === user.teacherId;
    const isHOD = user.role === 'HOD';
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isTG && !isHOD && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to view this attachment');
    }
  } else if (leave) {
    const isOwner = leave.applicant.toString() === user.id;
    const isTG = user.isTG && leave.tg?.toString() === user.teacherId;
    const isHOD = user.role === 'HOD';
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isTG && !isHOD && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to view this attachment');
    }
  }

  const ik = getImageKit();
  if (!ik) {
    return {
      url: `https://dummy-imagekit.local/signed/${fileId}`,
      expiresIn: 300,
    };
  }

  const details = await ik.getFileDetails(fileId);
  const signedUrl = ik.url({
    path: details.filePath,
    signed: true,
    expireSeconds: 300, // 5 minutes
  });

  return {
    url: signedUrl,
    expiresIn: 300,
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
  if (ik) {
    const details = await ik.getFileDetails(fileId);
    if (!details.filePath.includes(userId)) {
      throw ApiError.forbidden('Cannot delete a file not owned by you');
    }
    await ik.deleteFile(fileId);
  }

  return { message: 'File deleted successfully' };
};

export default {
  getAuthParameters,
  verifyUpload,
  generateSignedUrl,
  deleteFile,
};
