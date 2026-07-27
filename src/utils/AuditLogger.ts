// src/utils/AuditLogger.ts
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; // Import your configured db

export const logAuditEvent = async (userId: string, action: string, details: any) => {
    try {
        await addDoc(collection(db, 'audit_log'), {
            userId,
            action,
            details,
            timestamp: serverTimestamp()
        });
        // console.log(`Audit Log: ${action} by ${userId}`);
    } catch (e) {
        console.error('Failed to log audit event:', e);
    }
};
