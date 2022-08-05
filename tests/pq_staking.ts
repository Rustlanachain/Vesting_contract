import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PqStaking } from "../target/types/pq_staking";
import { createSenderTokenAccount } from "./stake_account";
import { clusterApiUrl, Connection, Keypair, Transaction, SystemProgram, PublicKey,} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, MintLayout, AccountLayout ,} from "@solana/spl-token";
import  {getAccount, getMinimumBalanceForRentExemptAccount, getAssociatedTokenAddress,ASSOCIATED_TOKEN_PROGRAM_ID,createInitializeAccountInstruction,}  from "@solana/spl-token";

import assert from "assert";
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as bs58 from "bs58";
import { min } from "bn.js";
import { parse } from "ts-node";



describe("pq_staking", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
  
    const program = anchor.workspace.PqStaking as Program<PqStaking>;

  
    // console.log(new PublicKey("BeNmPZGxH7JTaf6AQwLGZ8ZjnudyngYZebxjnVzDEm74"), "pub testing");

    // result:
    // PublicKey {
    //     _bn: <BN: 9e27f82620fdec4fc839c3118c680e4ae51a67d140b1b656b709255d1a73fc77>
    //   } pub testing

      it('can stake vault create!', async () => {
          try{
              const [stakeVaultPda, stakeVaultBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from('stakeVault')], program.programId);
              console.log("PDA: ", stakeVaultPda.toBase58());  // PDA: 94vMQdL1XavExQYii3V5P2yJjFD54a2jayB8HKadbEoL   //CLMr3m5RjScqxmRFwAnn6SWdBjTj3CY132EGcSPMvSMc //BcX2VZ1grFkqvL6uh2sX5cySPHWivuv7H5dnZyAjWB87 PDA for me
              let min_amount = new anchor.BN(10e9);
              let max_amount = new anchor.BN(500e9);
              let stakeTiers = [
                  {"days": 7, "percentage": 375 },
                  {"days": 30,"percentage": 575 },
                  {"days": 60,"percentage": 775 },
                  {"days": 120,"percentage": 975 }
              ];
              let admin= program.provider.wallet.publicKey;

              const txn = await program.rpc.createStakeVault(stakeVaultBump, stakeTiers, min_amount, max_amount, 86400,admin, {
                  accounts: {
                      signer: program.provider.wallet.publicKey,
                      vaultAccount: stakeVaultPda,
                      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                      systemProgram: anchor.web3.SystemProgram.programId,
                  }
              });
              assert.ok(true);
              console.log("Stake vault PDA  transaction signature: ", txn);
          } catch (e) {
              assert.equal(e.message, "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x0");
          }
      });
  
  
      let mint;
      let sender_token;
      let receiver;
      let receiver_token;
      const stakeAccount  = anchor.web3.Keypair.generate();
      let holders=[];
      it('setup mints and token accounts', async () => {
          // Create Mint Account
        //  let mint = Keypair.generate(); //change mint address
        // mint = new PublicKey("BeNmPZGxH7JTaf6AQwLGZ8ZjnudyngYZebxjnVzDEm74");
        mint = new PublicKey("BMyx7L9hLkWFcFun4JzgLyEWM6nfAHm1K8cDPuD8xEca");
        // const connection = new Connection(clusterApiUrl('devnet'))
       
        // const accounts = await program.provider.connection.getProgramAccounts(ASSOCIATED_TOKEN_PROGRAM_ID, mint)
        // const accounts = await program.provider.connection.getProgramAccounts(TOKEN_PROGRAM_ID, 
        //   {
        //     dataSlice: {
        //       offset: 0, // number of bytes
        //       length: 0, // number of bytes
        //     },
        //     filters: [
        //       {
        //         dataSize: 165, // number of bytes
        //       },
        //       {
        //         memcmp: {
        //           offset: 0, // number of bytes
        //           bytes: mint.toBase58(), // base58 encoded string
        //         },
        //       },
        //     ],
        //   })

          
          const pasedAccounts = await program.provider.connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, 
            {
              filters: [
                {
                  dataSize: 165, // number of bytes
                },
                {
                  memcmp: {
                    offset: 0, // number of bytes
                    bytes: mint.toBase58(), // base58 encoded string
                  },
                },
              ],
            })
            // console.log("tessssstttstststs pasedAccounts", pasedAccounts)
            const holder_parsed_accounts_result=pasedAccounts.map(account =>{
              // console.log("consoled account.account.data", account.account.data);
              // console.log("consoled owner", account.account.data["parsed"]["info"]["owner"]);
              // console.log(`Token contract address: ${account.account.owner.toBase58()}`);
              console.log(" holder token account address", account.pubkey.toBase58());
               holders.push(account.account.data["parsed"]["info"]["owner"]);
              return account.account.data["parsed"]["info"]["owner"];
            })
            console.log(holder_parsed_accounts_result,"token holder wallet address");
            // holders=holder_parsed_accounts_result;
          // console.log("tessssstttstststs accounts", accounts)
          // console.log("tessssstttstststs accounts accounts[0].pubkey.toBase58()", accounts[0].pubkey.toBase58());
          // console.log("tessssstttstststs accounts accounts[0].pubkey.toBase58()", accounts[1].pubkey.toBase58());
          // const holder_accounts_result=accounts.map(account =>{
          //   console.log("consoled", account.account.data.buffer);
          //   console.log(`Mint: ${account.account.data.length}`);
          //   return account.pubkey.toBase58();
          // })
          // console.log(holder_accounts_result,"holder_accounts_result");
          // console.log(holder_accounts_result.length,"holder_accounts_result");

      // console.log("tessssstttstststs accounts[1].account.owner.toBase58()", accounts[1].account.owner.toBase58())
      // console.log("tessssstttstststs accounts[1].account.data.toJSON()", accounts[1].account.data)
      // console.log("tessssstttstststs  accounts[1].account.owner.toBase58()", accounts[2].account.owner.toBase58())
      // console.log("tessssstttstststs  accounts[1].account.owner.toBase58()", accounts[2].account.data)
      // console.log("tessssstttstststs accounts[1].pubkey.toBase58()", accounts[1].pubkey.toBase58())
          console.log(mint, "mint or token address");
        //   console.log(mint, "mint or token address")

        //   let create_mint_tx = new Transaction().add(
        //       // create mint account
        //       SystemProgram.createAccount({
        //           fromPubkey: program.provider.wallet.publicKey,
        //           newAccountPubkey: mint.publicKey,
        //         //   newAccountPubkey: mint,
        //           space: MintLayout.span,
        //           lamports: await Token.getMinBalanceRentForExemptMint(program.provider.connection),
        //           programId: TOKEN_PROGRAM_ID,
        //       }),
        //       // init mint account
        //       Token.createInitMintInstruction(
        //           TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
        //           mint.publicKey, // mint pubkey
        //         //   mint, // mint pubkey
        //           6, // decimals
        //           program.provider.wallet.publicKey, // mint authority
        //           program.provider.wallet.publicKey // freeze authority (if you don't need it, you can set `null`)
        //       )
        //   );
        //   await program.provider.send(create_mint_tx, [mint]);
  
          // Create Sender Token Account 

        //   sender_token = Keypair.generate();
        //   let create_sender_token_tx = createSenderTokenAccount(sender_token, mint); 

          //we already have token account
        //   const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
          console.log("sender test started")

          //   sender_token= new PublicKey("4VAFPZrzgoGEEHfFNVT31Vopzn3KYd1BcvY9vKQBNcRK");
          //   let testing_fetch_token_account_from_wallet =await getAssociatedTokenAddress(mint, program.provider.wallet.publicKey ,true, TOKEN_PROGRAM_ID,ASSOCIATED_TOKEN_PROGRAM_ID);
          // console.log(testing_fetch_token_account_from_wallet.toBase58(),"testing_fetch_token_account_from_wallet.toBase58()");
          // console.log(testing_fetch_token_account_from_wallet,"testing_fetch_token_account_from_wallet");


          sender_token =await getAssociatedTokenAddress(mint, program.provider.wallet.publicKey ,true, TOKEN_PROGRAM_ID,ASSOCIATED_TOKEN_PROGRAM_ID);
          console.log(sender_token,"sender_token")

        // let sender_token = await getAccount(program.provider.connection, mint);
        // let sender_token_acc2 = await getAccount(program.provider.connection, mint);

        // console.log(sender_token_acc2,"sender_token_acc2")

        // let sender_token_acc = await getAccount(program.provider.connection, sender_token);
        //       console.log(sender_token_acc, "sender_token_acc");

          console.log(sender_token,"sender test started")
          console.log(sender_token.toBase58(),"sender test started")

          console.log("token balance: ", await program.provider.connection.getTokenAccountBalance(sender_token));

          // Create Receiver Token Account
          const seed = Buffer.from(anchor.utils.bytes.utf8.encode("stakeVault"));
          const [stakeVaultPDA, _stakeVaultBump] = await anchor.web3.PublicKey.findProgramAddress([seed],program.programId);
          receiver = stakeVaultPDA;       // Vault PubKey: 94vMQdL1XavExQYii3V5P2yJjFD54a2jayB8HKadbEoL  // for me CxcNniWZ8tugb4kQVwBigndHWPaZk37M69vedxZXRWxQ
          console.log(stakeVaultPDA.toBase58(), "stakeVaultPDA.toBase58(),")
          let AssociatedTokenAddress=await getAssociatedTokenAddress(mint, stakeVaultPDA,true, TOKEN_PROGRAM_ID,ASSOCIATED_TOKEN_PROGRAM_ID);
        receiver_token=await getAssociatedTokenAddress(mint, stakeVaultPDA,true, TOKEN_PROGRAM_ID,ASSOCIATED_TOKEN_PROGRAM_ID);
          console.log("getAssociatedTokenAddress",await getAssociatedTokenAddress(mint, stakeVaultPDA,true, TOKEN_PROGRAM_ID,ASSOCIATED_TOKEN_PROGRAM_ID))
          console.log("AssociatedTokenAddress.tobase58()",AssociatedTokenAddress.toBase58());

        //  let receiver_token_test = Keypair.generate();
        //   console.log(receiver_token_test.publicKey, "receiver_token_test.publicKey")
        //   console.log(receiver_token_test.publicKey.toBase58(), "receiver_token_test.publicKey.tobase58()")
        //   console.log(receiver_token.publicKey.toBase58(), "receiver_token.publicKey")
        //   let create_receiver_token_tx = new Transaction().add(
        //       // create token account
        //       SystemProgram.createAccount({
        //           fromPubkey: program.provider.wallet.publicKey,
        //           newAccountPubkey: receiver_token.publicKey,
        //           space: AccountLayout.span,
        //         //   lamports: await Token.getMinBalanceRentForExemptAccount(program.provider.connection),
        //           lamports: await getMinimumBalanceForRentExemptAccount(program.provider.connection),
        //           programId: TOKEN_PROGRAM_ID,
        //       }),
        //       // init mint account
        //     //   Token.createInitAccountInstruction(
        //     //       TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
        //     //     //   mint.publicKey, // mint
        //     //       mint, // mint
        //     //       receiver_token.publicKey, // token account
        //     //       receiver // owner of token account
        //     //   )
        //       createInitializeAccountInstruction(
        //         receiver_token.publicKey, // token account
        //         mint, // mint
        //         receiver, // owner of token account
        //         TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
        //       //   mint.publicKey, // mint
        //     )
        //   );
        //   await program.provider.send(create_receiver_token_tx, [receiver_token]);
  
        //   console.log(create_receiver_token_tx,"create_receiver_token_tx")


          // Mint Token
        //   let mint_tokens_tx = new Transaction().add(
        //       Token.createMintToInstruction(
        //           TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
        //         //   mint.publicKey, // mint
        //           mint, // mint
        //         //   sender_token.publicKey, // receiver (should be a token account)
        //           sender_token, // receiver (should be a token account)
        //           program.provider.wallet.publicKey, // mint authority
        //           [], // only multisig account will use. leave it empty now.
        //           50e6 // amount. if your decimals is 8, you mint 10^8 for 1 token.
        //       )
        //   );
        //   await program.provider.send(mint_tokens_tx);
        //   let token_balance = await program.provider.connection.getTokenAccountBalance(sender_token.publicKey);
        //   let token_balance = await program.provider.connection.getTokenAccountBalance(sender_token);
        //   assert.equal(token_balance.value.amount, 10000e9)
        //   console.log("token balance: ", await program.provider.connection.getTokenAccountBalance(sender_token.publicKey));
          console.log("token balance: ", await program.provider.connection.getTokenAccountBalance(sender_token));
      });
  
      it('can stake token!', async () => {
        //   let amount = new anchor.BN(2e6);
          let amount = new anchor.BN(2e9);
          const stake_tx =  await program.rpc.stakeToken(amount, {
              accounts: {
                  stakeAccount: stakeAccount.publicKey,
                  sender: program.provider.wallet.publicKey,
                  systemProgram: anchor.web3.SystemProgram.programId,
                  senderToken: sender_token, //   senderToken: sender_token.publicKey,
                //   receiverToken: receiver_token.publicKey,
                  receiverToken: receiver_token,
                  mint: mint,  //   mint: mint.publicKey,
                  tokenProgram: TOKEN_PROGRAM_ID,
              },
              signers:[stakeAccount]
          });

          console.log(stake_tx,"stake_txstake_tx")
        //   let sender_balance   = await program.provider.connection.getTokenAccountBalance(sender_token.publicKey);
          let sender_balance   = await program.provider.connection.getTokenAccountBalance(sender_token);
        //   let receiver_balance = await program.provider.connection.getTokenAccountBalance(receiver_token.publicKey);
          let receiver_balance = await program.provider.connection.getTokenAccountBalance(receiver_token);
        //   assert.equal(sender_balance.value.amount, 48e6);
        //   assert.equal(receiver_balance.value.amount, 2e6);

        //   assert.equal(sender_balance.value.amount, 9998e9);
        //   assert.equal(receiver_balance.value.amount, 52e9);


          console.log("Stake token transaction signature: ", stake_tx);
          console.log("sender token balance: ", await program.provider.connection.getTokenAccountBalance(sender_token));
        //   console.log("receiver token balance: ", await program.provider.connection.getTokenAccountBalance(receiver_token.publicKey));
          console.log("receiver token balance: ", await program.provider.connection.getTokenAccountBalance(receiver_token));
      });
  
      it('can unstake token! ', async () => {
        // console.log("sender: " , sender_token.publicKey.toBase58());
        // console.log("receiver ", receiver_token.publicKey.toBase58());
        console.log("sender: " , sender_token.toBase58());
        // console.log("receiver ", receiver_token.publicKey.toBase58());
        console.log("receiver ", receiver_token.toBase58());
        console.log("holders",holders)
          let admin=program.provider.wallet.publicKey;
        //   let amount = new anchor.BN(2e6);
          let amount = new anchor.BN(2e9);
          const [stakeVaultPda, _stakeVaultBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from('stakeVault')], program.programId);
        //   const unstake_tx =  await program.rpc.unstakeToken(amount,{
            const unstake_tx =  await program.rpc.unstakeToken({
              accounts: {
                  stakeAccount: stakeAccount.publicKey,
                  fromAddress: program.provider.wallet.publicKey,
                  systemProgram: anchor.web3.SystemProgram.programId,
                //   vaultAccountPda: receiver_token.publicKey,
                  vaultAccountPda: receiver_token,
                //   userAccount: sender_token.publicKey,
                  userAccount: sender_token,
                  vaultAuthority: stakeVaultPda,
                //   mint: mint.publicKey,
                  mint: mint,
                  tokenProgram: TOKEN_PROGRAM_ID,
                  //testing
                  // adminWallet:admin
                  vaultAccount:stakeVaultPda,
              }
          });
        //   let sender_balance   = await program.provider.connection.getTokenAccountBalance(sender_token.publicKey);
          let sender_balance   = await program.provider.connection.getTokenAccountBalance(sender_token);
        //   let receiver_balance = await program.provider.connection.getTokenAccountBalance(receiver_token.publicKey);
          let receiver_balance = await program.provider.connection.getTokenAccountBalance(receiver_token);
          console.log("sender_balance",sender_balance);
          console.log("receiver_balance",receiver_balance);
        //   assert.equal(sender_balance.value.amount, 50e6);

        //   assert.equal(sender_balance.value.amount, 10000e9);
        //   assert.equal(receiver_balance.value.amount, 50e9);

          console.log("Un-stake token transaction signature: ", unstake_tx);
      });
  
  });