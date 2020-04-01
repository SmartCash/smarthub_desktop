declare module 'smartcashjs-lib/src' {
  namespace bufferutils {
    function pushDataSize(i: any): 1 | 2 | 3 | 5;
    function readPushDataInt(buffer: any, offset: any): {
      [x: string]: any;
      opcode: any;
      number: any;
      size: number;
    };
    function readUInt64LE(buffer: any, offset: any): any;
    function readVarInt(buffer: any, offset: any): {
      [x: string]: any;
      number: number;
      size: any;
    }
    function varIntBuffer(number: any, buffer: any, offset: any): Buffer;
    function varIntSize(number: any): 1 | 3 | 5 | 9;
    function writePushDataInt(buffer: any, number: any, offset: any): number;
    function writeUInt64LE(buffer: any, value: any, offset: any): any;
    function writeVarInt(buffer: any, number: any, offset: any): any;
  }
  namespace address {
    function fromBase58Check(address: any): {
      [x: string]: any;
      version: any;
      hash: any;
    };
    function fromBech32(address: any): {
      [x: string]: any;
      version: number;
      prefix: string;
      data: Buffer;
    };
    function fromOutputScript(outputScript: any, network: any): string;
    function toBase58Check(hash: any, version: any, ...args: any[]): string;
    function toBech32(data: any, version: any, prefix: any): string;
    function toOutputScript(address: any, network: any): any;
  }
  namespace crypto {
    function hash160(buffer: any): Buffer;
    function hash256(buffer: any): Buffer;
    function ripemd160(buffer: any): Buffer;
    function sha1(buffer: any): Buffer;
    function sha256(buffer: any): Buffer;
    function keccak256(buffer: any): Buffer;
  }
  namespace networks {
    interface bitcoin {
      [x: string]: any;
      messagePrefix: string;
      bech32: string;
      bip32: {
        [x: string]: any;
        public: number;
        private: number;
      };
      pubKeyHash: number;
      scriptHash: number;
      wif: number;
    }
    interface testnet {
      [x: string]: any;
      messagePrefix: string;
      bech32: string;
      bip32: {
        [x: string]: any;
        public: number;
        private: number;
      };
      pubKeyHash: number;
      scriptHash: number;
      wif: number;
    }
  }
  namespace script {
    function compile(chunks: any): Buffer;
    function decompile(buffer: any): any;
    function fromASM(asm: any): Buffer;
    function toASM(chunks: any): any;
    function toStack(chunks: any): any;
    module number {
      function decode(buffer: any, maxLength: any, minimal: any): any;
      function encode(number: any): Buffer;
    }
    function isCanonicalPubKey(buffer: any): boolean;
    function isCanonicalSignature(buffer: any): boolean;
    function isPushOnly(value: any): any;
    function isDefinedHashType(hashType: any): boolean;
    function classifyInput(script: any, allowIncomplete: any): string;
    function classifyOutput(script: any): string;
    function classifyWitness(script: any, allowIncomplete: any): string;
    module multisig {
      module input {
        function check(script: any): boolean;
        function decode(buffer: any, allowIncomplete: any): any;
        function decodeStack(stack: any, allowIncomplete: any): any;
        function encode(signatures: any, scriptPubKey: any): Buffer;
        function encodeStack(signatures: any, scriptPubKey: any): any[];
      }
      module output {
        function check(script: any): boolean;
        function decode(buffer: any, allowIncomplete: any): {
            [x: string]: any;
            m: number;
            pubKeys: any;
        };
        function encode(m: any, pubKeys: any): Buffer;
      }
    }
    module nullData {
      module output {
        function check(script: any): boolean;
        function decode(buffer: any): any;
        function encode(data: any): Buffer;
      }
    }
    module pubKey {
      module input {
        function check(script: any): boolean;
        function decode(buffer: any): any;
        function decodeStack(stack: any): any;
        function encode(signature: any): Buffer;
        function encodeStack(signature: any): any[];
      }
      module output {
        function check(script: any): boolean;
        function decode(buffer: any): any;
        function encode(pubKey: any): Buffer;
      }
    }
    module pubKeyHash {
      module input {
        function check(script: any): boolean;
        function decode(buffer: any): {
            [x: string]: any;
            signature: any;
            pubKey: any;
        };
        function decodeStack(stack: any): {
            [x: string]: any;
            signature: any;
            pubKey: any;
        };
        function encode(signature: any, pubKey: any): Buffer;
        function encodeStack(signature: any, pubKey: any): any[];
      }
      module output {
        function check(script: any): boolean;
        function decode(buffer: any): any;
        function encode(pubKeyHash: any): Buffer;
      }
    }
    module scriptHash {
      module input {
        function check(script: any): boolean;
        function decode(buffer: any): {
          [x: string]: any;
          redeemScriptStack: any;
          redeemScript: any;
        };
        function decodeStack(stack: any): {
          [x: string]: any;
          redeemScriptStack: any;
          redeemScript: any;
        };
        function encode(redeemScriptSig: any, redeemScript: any): Buffer;
        function encodeStack(redeemScriptStack: any, redeemScript: any): any[];
      }
      module output {
        function check(script: any): boolean;
        function decode(buffer: any): any;
        function encode(scriptHash: any): Buffer;
      }
    }
    module witnessPubKeyHash {
      module input {
        function check(script: any): boolean;
        function decodeStack(stack: any): {
          [x: string]: any;
          signature: any;
          pubKey: any;
        };
        function encodeStack(signature: any, pubKey: any): any[];
      }
      module output {
        function check(script: any): boolean;
        function decode(buffer: any): any;
        function encode(pubKeyHash: any): Buffer;
      }
    }
    module witnessScriptHash {
      module input {
        function check(script: any): boolean;
        function decodeStack(stack: any): {
          [x: string]: any;
          witnessData: any;
          witnessScript: any;
        };
        function encodeStack(witnessData: any, witnessScript: any): any[];
      }
      module output {
        function check(script: any): boolean;
        function decode(buffer: any): any;
        function encode(scriptHash: any): Buffer;
      }
    }
    module witnessCommitment {
      module output {
        function check(script: any): boolean;
        function decode(buffer: any): any;
        function encode(commitment: any): Buffer;
      }
    }
    interface types {
      [x: string]: any;
      MULTISIG: string;
      NONSTANDARD: string;
      NULLDATA: string;
      P2PK: string;
      P2PKH: string;
      P2SH: string;
      P2WPKH: string;
      P2WSH: string;
      WITNESS_COMMITMENT: string;
    }
  }
  function amount(amount: number | string, fee?: number | string): number;
  interface ECPair {
    new (d: any, Q?: any, options?: any): void;
    getAddress(): string;
  }
  namespace ECPair {
    function fromWIF(string: any, network?: any): ECPair;
  }
  class ECPair {
    constructor(d: any, Q?: any, options?: any);
    fromWIF(string: any, network?: any): ECPair;
    getAddress(): string;
    toWIF(): string;
  }
  interface Transaction {
    toHex(): string;
  }
  class TransactionBuilder {
    constructor(network?: any, maximumFeeRate?: any);
    addInput(txHash: any, vout: any, sequence?: any, prevOutScript?: any): number;
    addOutput(scriptPubKey: any, value: any): number;
    sign(vin: any, keyPair: any, redeemScript?: any, hashType?: any, witnessValue?: any, witnessScript?: any): void;
    setLockTime(blockHeight: number): void;
    build(): Transaction;
  }
  function HDNode(keyPair: any, chainCode: any, ...args: any[]): void;
  module HDNode {
    const HIGHEST_BIT: any;
    const LENGTH: any;
    const MASTER_SECRET: any;
    function fromSeedBuffer(seed: any, network?: any, ...args: any[]): HDNode;
    function fromSeedHex(hex: any, network?: any): HDNode;
    function fromBase58(string: any, networks?: any): HDNode;
    class HDNode {
      getAddress(): any;
      getIdentifier(): Buffer;
      getFingerprint(): Buffer;
      getPublicKeyBuffer(): any;
      getPublicKeyBuffer(): any;
      toWIF(): any;
      neutered(): HDNode;
      sign(hash: any): any;
      verify(hash: any, signature: any): any;
      toBase58(__isPrivate?: any): string;
      derive(index: any): any;
      deriveHardened(index: any): any;
      isNeutered(): boolean;
      derivePath(path: any): any;
    }
  }
}

declare module 'aes256';
declare module 'jszip';
declare module 'qrious';
declare module 'jspdf';
