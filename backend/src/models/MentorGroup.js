import mongoose from 'mongoose';

const mentorGroupSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    tg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

mentorGroupSchema.index({ tg: 1, isActive: 1 });

const MentorGroup = mongoose.model('MentorGroup', mentorGroupSchema);
export default MentorGroup;
