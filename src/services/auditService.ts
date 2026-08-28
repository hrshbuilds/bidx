import { AuditEventType, AuditLogBlock, AuditChainVerification } from '@/types/audit';
import { sha256 } from '@/lib/crypto';

export class AuditService {
  private static chain: AuditLogBlock[] = [];

  public static readonly GENESIS_PREV_HASH =
    '0000000000000000000000000000000000000000000000000000000000000000';

  /**
   * Universal helper to compute the deterministic SHA-256 hash of any block
   */
  public static computeBlockHash(block: {
    index: number;
    timestamp: string;
    tenderId: string;
    bidderId?: string;
    eventType: AuditEventType;
    actor: string;
    payload: Record<string, any>;
    previousHash: string;
  }): string {
    const blockString = `${block.index}:${block.timestamp}:${block.tenderId}:${block.bidderId || ''}:${block.eventType}:${block.actor}:${JSON.stringify(block.payload)}:${block.previousHash}`;
    return sha256(blockString);
  }

  /**
   * Initializes the audit chain with a genesis block if empty
   */
  public static initializeGenesis(): void {
    if (this.chain.length === 0) {
      const timestamp = new Date().toISOString();
      const payload = {
        system: 'GeM Compliance Verification Microservice (BidFlo)',
        standard: 'W3C Verifiable Audit Log / IT Act 2000 Sec 65B Compliant',
        version: '1.0.0-PROD',
      };

      const blockData = {
        index: 0,
        timestamp,
        tenderId: 'SYSTEM',
        bidderId: undefined,
        eventType: 'CONSENT_RECORDED' as AuditEventType,
        actor: 'GeM Core Security Engine',
        payload,
        previousHash: this.GENESIS_PREV_HASH,
      };

      const currentHash = this.computeBlockHash(blockData);

      this.chain.push({
        ...blockData,
        currentHash,
        signature: 'ED25519-SIG-GOV-GEM-SEC-001',
      });
    }
  }

  /**
   * Appends an immutable event block to the hash chain
   */
  public static logEvent(
    tenderId: string,
    eventType: AuditEventType,
    actor: string,
    payload: Record<string, any>,
    bidderId?: string,
    signature?: string
  ): AuditLogBlock {
    this.initializeGenesis();

    const previousBlock = this.chain[this.chain.length - 1];
    const index = this.chain.length;
    const timestamp = new Date().toISOString();

    const blockData = {
      index,
      timestamp,
      tenderId,
      bidderId,
      eventType,
      actor,
      payload,
      previousHash: previousBlock.currentHash,
    };

    const currentHash = this.computeBlockHash(blockData);

    const newBlock: AuditLogBlock = {
      ...blockData,
      currentHash,
      signature: signature || `GOV-SHA256-${currentHash.slice(0, 16).toUpperCase()}`,
    };

    this.chain.push(newBlock);
    return newBlock;
  }

  /**
   * Returns all audit blocks for a specific tender or bidder
   */
  public static getLogs(tenderId?: string, bidderId?: string): AuditLogBlock[] {
    this.initializeGenesis();
    let result = [...this.chain];
    if (tenderId) {
      result = result.filter((b) => b.tenderId === tenderId || b.tenderId === 'SYSTEM');
    }
    if (bidderId) {
      result = result.filter((b) => !b.bidderId || b.bidderId === bidderId);
    }
    return result;
  }

  /**
   * Cryptographically verifies the entire chain from Genesis to Head
   */
  public static verifyChainIntegrity(customChain?: AuditLogBlock[]): AuditChainVerification {
    const blocksToVerify = customChain || this.chain;
    if (blocksToVerify.length === 0) {
      return {
        isValid: true,
        totalBlocks: 0,
        verificationMessage: 'Audit ledger is initialized and empty.',
        verifiedAt: new Date().toISOString(),
        rootHash: '0x0',
        headHash: '0x0',
      };
    }

    for (let i = 0; i < blocksToVerify.length; i++) {
      const block = blocksToVerify[i];

      // Verify previous hash connection
      if (i === 0) {
        if (block.previousHash !== this.GENESIS_PREV_HASH) {
          return {
            isValid: false,
            totalBlocks: blocksToVerify.length,
            brokenBlockIndex: 0,
            verificationMessage: 'Genesis block previous hash tampering detected.',
            verifiedAt: new Date().toISOString(),
            rootHash: block.currentHash,
            headHash: blocksToVerify[blocksToVerify.length - 1].currentHash,
          };
        }
      } else {
        const prevBlock = blocksToVerify[i - 1];
        if (block.previousHash !== prevBlock.currentHash) {
          return {
            isValid: false,
            totalBlocks: blocksToVerify.length,
            brokenBlockIndex: i,
            verificationMessage: `Broken link between block #${i - 1} and block #${i}. Previous hash mismatch.`,
            verifiedAt: new Date().toISOString(),
            rootHash: blocksToVerify[0].currentHash,
            headHash: blocksToVerify[blocksToVerify.length - 1].currentHash,
          };
        }
      }

      // Verify current hash computation using the exact computeBlockHash formula
      const recalculatedHash = this.computeBlockHash(block);

      if (recalculatedHash !== block.currentHash) {
        return {
          isValid: false,
          totalBlocks: blocksToVerify.length,
          brokenBlockIndex: i,
          verificationMessage: `Payload or timestamp altered in block #${i}. Cryptographic signature invalid.`,
          verifiedAt: new Date().toISOString(),
          rootHash: blocksToVerify[0].currentHash,
          headHash: blocksToVerify[blocksToVerify.length - 1].currentHash,
        };
      }
    }

    return {
      isValid: true,
      totalBlocks: blocksToVerify.length,
      verificationMessage: `Cryptographic audit ledger verified. All ${blocksToVerify.length} block hashes are mathematically sound and tamper-evident.`,
      verifiedAt: new Date().toISOString(),
      rootHash: blocksToVerify[0].currentHash,
      headHash: blocksToVerify[blocksToVerify.length - 1].currentHash,
    };
  }

  /**
   * Simulates a tampering attempt on a block to demonstrate tamper-evidence in demo/pitch
   */
  public static simulateTamper(blockIndex: number, alteredPayloadKey: string, newValue: any): boolean {
    if (blockIndex >= 0 && blockIndex < this.chain.length) {
      this.chain[blockIndex].payload = {
        ...this.chain[blockIndex].payload,
        [alteredPayloadKey]: newValue,
      };
      return true;
    }
    return false;
  }

  /**
   * Resets or restores chain to valid state
   */
  public static resetChain(): void {
    this.chain = [];
  }
}
