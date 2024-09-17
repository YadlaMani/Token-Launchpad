import { useState } from "react";
import {
  Keypair,
  SystemProgram,
  Transaction,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  getMintLen,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

import { createInitializeInstruction } from "@solana/spl-token-metadata";
import initialFormData from "../utils/fromData";

const TokenLaunchPad = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState(null);

  const METADATA_2022_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  async function createToken() {
    setError(null);
    try {
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      const mintKeyPair = Keypair.generate();
      console.log("Mint public key:", mintKeyPair.publicKey.toBase58());

      const [metadataAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), mintKeyPair.publicKey.toBuffer()],
        METADATA_2022_PROGRAM_ID
      );
      console.log("Metadata address:", metadataAddress.toBase58());

      const metadata = {
        name: formData.name,
        symbol: formData.tokenSymbol,
        uri: formData.tokenImage,
      };
      console.log("Metadata:", metadata);

      const mintLen = getMintLen([ExtensionType.MetadataPointer]);
      const mintLamports = await connection.getMinimumBalanceForRentExemption(
        mintLen
      );
      const metadataLen = 1 + 32 + 32 + 200; // Rough estimate, adjust if necessary
      const metadataLamports =
        await connection.getMinimumBalanceForRentExemption(metadataLen);

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeyPair.publicKey,
          space: mintLen,
          lamports: mintLamports,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: metadataAddress,
          space: metadataLen,
          lamports: metadataLamports,
          programId: METADATA_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
          mintKeyPair.publicKey,
          wallet.publicKey,
          metadataAddress,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
          mintKeyPair.publicKey,
          9, // Decimals
          wallet.publicKey,
          wallet.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeInstruction({
          programId: METADATA_2022_PROGRAM_ID,
          metadata: metadataAddress,
          updateAuthority: wallet.publicKey,
          mint: mintKeyPair.publicKey,
          mintAuthority: wallet.publicKey,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
        })
      );

      // Ensure the transaction is signed by both the wallet and the mint keypair
      transaction.feePayer = wallet.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // **Partial Sign with mintKeyPair**
      transaction.partialSign(mintKeyPair);

      // **Sign with Wallet**
      const signedTransaction = await wallet.signTransaction(transaction);

      console.log("Transaction signed");

      const rawTransaction = signedTransaction.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        preflightCommitment: "confirmed",
      });
      console.log("Transaction sent:", txid);

      const confirmation = await connection.confirmTransaction(
        txid,
        "confirmed"
      );
      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }
      console.log("Transaction confirmed");

      console.log(`Token mint created at ${mintKeyPair.publicKey.toBase58()}`);
      console.log(`Metadata address: ${metadataAddress.toBase58()}`);
    } catch (err) {
      console.error("Error creating token:", err);
      setError(err.message || "An unexpected error occurred");
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Create Your Token
      </h2>
      <div className="space-y-4">
        <div>
          <input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-300"
            placeholder="Enter token Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-300"
            placeholder="Enter token Symbol"
            value={formData.tokenSymbol}
            onChange={(e) =>
              setFormData({ ...formData, tokenSymbol: e.target.value })
            }
          />
        </div>
        <div>
          <input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-300"
            placeholder="Upload token image (URI)"
            value={formData.tokenImage}
            onChange={(e) =>
              setFormData({ ...formData, tokenImage: e.target.value })
            }
          />
        </div>
        <div>
          <input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-300"
            placeholder="Initial Supply"
            value={formData.initialSupply}
            onChange={(e) =>
              setFormData({ ...formData, initialSupply: e.target.value })
            }
            type="number"
          />
        </div>
        <div>
          <button
            onClick={createToken}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
          >
            Create Token
          </button>
        </div>
      </div>
      {error && <div className="mt-4 text-red-500 text-center">{error}</div>}
    </div>
  );
};

export default TokenLaunchPad;
