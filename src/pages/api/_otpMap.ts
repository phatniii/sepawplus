// pages/api/_otpMap.ts
type OTPEntry = {
    otp: string;
    expiresAt: number;
  };
  
  const otpMap = new Map<string, OTPEntry>();
  
  export default otpMap;
  