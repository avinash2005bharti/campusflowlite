import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorRole: {
      type: String,
      enum: ['HOD', 'ADMIN', 'TEACHER', 'TG'],
      default: 'HOD',
    },
    category: {
      type: String,
      enum: ['CIRCULAR', 'ACADEMIC', 'EXAM', 'EVENT', 'URGENT', 'GENERAL'],
      default: 'CIRCULAR',
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'STUDENTS', 'FACULTY', 'SEMESTER', 'SECTION'],
      default: 'ALL',
    },
    targetSemester: {
      type: Number,
      default: null,
    },
    targetSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    attachmentName: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ targetAudience: 1, targetSemester: 1 });

const Notice = mongoose.model('Notice', noticeSchema);
export default Notice;
