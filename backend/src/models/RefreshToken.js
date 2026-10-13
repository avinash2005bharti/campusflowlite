import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-expire documents
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
