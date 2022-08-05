import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PqStaking } from "../target/types/pq_staking";
import {Keypair, SystemProgram, Transaction} from "@solana/web3.js";
import {AccountLayout, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";

anchor.setProvider(anchor.Provider.env());
const program = anchor.workspace.PqStaking as Program<PqStaking>;

export  const  createSenderTokenAccount = async (sender_token,mint) => {
    const  create_sender_token_tx =  new Transaction().add(
        // create token account
        SystemProgram.createAccount({
            fromPubkey: program.provider.wallet.publicKey,
            newAccountPubkey: sender_token.publicKey,
            space: AccountLayout.span,
            lamports: await Token.getMinBalanceRentForExemptAccount(program.provider.connection),
            programId: TOKEN_PROGRAM_ID,
        }),
        // init mint account
        Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
            mint.publicKey, // mint
            sender_token.publicKey, // token account
            program.provider.wallet.publicKey // owner of token account
        )
    );
    console.log("stake account called")
    await program.provider.send(create_sender_token_tx, [sender_token]);
}


