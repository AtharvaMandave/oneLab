/**
 * Custom hook for managing reconciliation state
 */

import { useState, useCallback, useMemo } from 'react';
import { reconcile } from '../engine/reconciliationEngine.js';
import { getDemoData } from '../data/syntheticData.js';
import { validatePlatformDataset, validateBankDataset } from '../utils/validation.js';

export function useReconciliation() {
  const [platformData, setPlatformData] = useState(() => getDemoData().platformTransactions);
  const [bankData, setBankData] = useState(() => getDemoData().bankSettlements);
  const [uploadErrors, setUploadErrors] = useState(null);

  // Run reconciliation dynamically whenever data changes
  const result = useMemo(() => {
    try {
      return reconcile(platformData, bankData);
    } catch (error) {
      console.error('Reconciliation error:', error);
      return null;
    }
  }, [platformData, bankData]);

  // Reset to demo data
  const resetToDemo = useCallback(() => {
    const { platformTransactions, bankSettlements } = getDemoData();
    setPlatformData(platformTransactions);
    setBankData(bankSettlements);
    setUploadErrors(null);
  }, []);

  // Upload platform transactions
  const uploadPlatformData = useCallback((rows) => {
    const { valid, invalid, allErrors } = validatePlatformDataset(rows);
    if (allErrors.length > 0) {
      setUploadErrors({ type: 'platform', errors: allErrors, invalidRows: invalid });
      return false;
    }
    setPlatformData(valid);
    setUploadErrors(null);
    return true;
  }, []);

  // Upload bank settlements
  const uploadBankData = useCallback((rows) => {
    const { valid, invalid, allErrors } = validateBankDataset(rows);
    if (allErrors.length > 0) {
      setUploadErrors({ type: 'bank', errors: allErrors, invalidRows: invalid });
      return false;
    }
    setBankData(valid);
    setUploadErrors(null);
    return true;
  }, []);

  return {
    platformData,
    bankData,
    result,
    uploadErrors,
    resetToDemo,
    uploadPlatformData,
    uploadBankData,
    setUploadErrors,
  };
}

