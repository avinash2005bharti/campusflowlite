import mongoose from 'mongoose';

const hodAppointmentSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
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

// Partial unique index ensuring at most one active HOD appointment per department
hodAppointmentSchema.index(
  { department: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

const HodAppointment = mongoose.model('HodAppointment', hodAppointmentSchema);
export default HodAppointment;
