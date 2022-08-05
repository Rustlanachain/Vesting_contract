use anchor_lang::prelude::*;
use anchor_lang::solana_program::{ program::invoke_signed, system_instruction,} ;
use anchor_spl::token::{self, Token, Mint, TokenAccount, Transfer,};


declare_id!("Ep5ExJgbm3C1C71QG9qdYE7ApQeJ8MetFSwAgRExs1Jv");

#[program]
pub mod pq_staking {
    use super::*;

    const STAKE_PDA_SEED: &[u8] = b"stakeVault";

    pub fn create_vault(ctx: Context<CreateStakeVault>, _bump: u8,length: u64, admin: Pubkey) -> Result<()> {
        msg!("Create function got called: {}",ctx.accounts.signer.key());
        let (pda, _bump_seed)  = Pubkey::find_program_address(&[STAKE_PDA_SEED], ctx.program_id);
        let clock:Clock   = Clock::get().unwrap();
        ctx.accounts.vault_account.admin_wallet = admin;
        if admin.key() != ctx.accounts.signer.key(){
            return Err(ErrorCode::InvalidSuperOwner.into());

        }
        if ctx.accounts.vault_account.admin_wallet.key() != ctx.accounts.signer.key(){
            return Err(ErrorCode::InvalidSuperOwner.into());

        }

        let vest_info: &mut Account<VestInfo>  = &mut ctx.accounts.vest_account;

        //STore start time
        vest_info.start_timestamp = clock.unix_timestamp;
        //store a amount/length
        vest_info.vest_length = length;
               //testing
        // let admin = "57MHux1bR1pJRK46GFJWj1gz8f7zMZqPL6AvZdCEnNd6".parse::<Pubkey>().unwrap();
        // ctx.accounts.vault_account.admin_wallet = admin;
        Ok(())
    }

    pub fn stake_token(ctx: Context<StakeToken>, amount: u64, ) -> Result<()> {
        // holders: Vec<Holder> //parameter
        msg!("starting tokens: {}", ctx.accounts.sender_token.amount);
        // msg!("holders{:?}", holders);
        // msg!("holders{}", holders[0]);

        if ctx.accounts.stake_account.stake_status == true {
            return Err(ErrorCode::AlreadyStaked.into());
        }
        token::transfer(ctx.accounts.transfer_ctx(), amount)?;
        ctx.accounts.sender_token.reload()?;
        msg!("remaining tokens: {}", ctx.accounts.sender_token.amount);
        let stake_holder: &mut Account<StakeAccount>  = &mut ctx.accounts.stake_account;
        let user: &Signer = & ctx.accounts.sender;
        let clock:Clock   = Clock::get().unwrap();
        stake_holder.from_address    = *user.key;
        stake_holder.stake_timestamp = clock.unix_timestamp;
        stake_holder.amount          = amount;
        stake_holder.stake_status    = true;

        // stake_holder.holders= holders;
        // msg!(" stake_holder.holders{:?}",  stake_holder.holders[1].account);

        Ok(())
    }

    // pub fn unstake_token(ctx: Context<UnstakeToken>, amount: u64) -> Result<()> {
        pub fn unstake_token(ctx: Context<UnstakeToken>,) -> Result<()> {
            // holders: Vec<Holder> //parameters
        // msg!("Unstake function got called {:?}", holders);
        msg!("Unstake function got called ");
        if ctx.accounts.stake_account.stake_status == false {
            return Err(ErrorCode::AlreadyUnStaked.into());
        }
        let clock = Clock::get()?;
        msg!("clock.unix_timestamp: {}", clock.unix_timestamp);
        msg!("ctx.accounts.stake_account.stake_timestamp: {}", ctx.accounts.stake_account.stake_timestamp);
        msg!("clock.unix_timestamp as u64-ctx.accounts.stake_account.stake_timestamp as u64: {}", clock.unix_timestamp as u64-ctx.accounts.stake_account.stake_timestamp as u64);

        let (_vault_authority, vault_authority_bump) = Pubkey::find_program_address(&[STAKE_PDA_SEED], ctx.program_id);
        let authority_seeds = &[STAKE_PDA_SEED, &[vault_authority_bump]];
        msg!("starting tokens: {}", ctx.accounts.vault_account_pda.amount);
               // token::transfer(ctx.accounts.transfer_to_stake_ctx().with_signer(&[authority_seeds]),amount)?;
               ctx.accounts.stake_account.reload()?;

        //added by rashid
        pub const EPOCH: i64 = 1;          // 1 sec
        let latest_reward_time=((clock.unix_timestamp-ctx.accounts.stake_account.stake_timestamp ) / EPOCH)as u64;
        msg!("latest_reward_time: {}",latest_reward_time);
         let reward=(latest_reward_time)* 1000000000 ;  //per sec is one
        // let mut new_amount=ctx.accounts.stake_account.amount + reward;
        let mut new_amount=ctx.accounts.stake_account.amount + reward;
        // let new_amount=ctx.accounts.stake_account.amount;
        // let (_pda, _bump_seed)  = Pubkey::find_program_address(&[STAKE_PDA_SEED], ctx.program_id);
        // msg!("_pda: {}",_pda);
        // msg!("_bump_seed: {}",_bump_seed);

        //logic for min_time error

        // let latest_reward_time2 =latest_reward_time as u32;
        // if latest_reward_time2 < ctx.accounts.vault_account.min_lock_time{
        //     return Err(ErrorCode::InvalidWithdrawTime.into());
        // }

        //logic for min_time error end



        //reward according to stake tires
        let reward_time_in_days= latest_reward_time / 86400;
        // let reward_time_in_days= 30; //for testing
        for x in &ctx.accounts.vault_account.reward_duration {
            msg!("x:{:?}", x);
            msg!("x.days: {:?}", x.days);
            msg!("x.percentage: {:?}", x.percentage);

            //you can set limit but for now we are using is equal
            if reward_time_in_days == ( x.days as u64){  
                msg!("ctx.accounts.stake_account.amount* (x.percentage as u64) {}",ctx.accounts.stake_account.amount* (x.percentage as u64));
                msg!("ctx.accounts.stake_account.amount {}",ctx.accounts.stake_account.amount);
                new_amount= ctx.accounts.stake_account.amount* (x.percentage as u64); // devided this hundred for testing
                // new_amount= (ctx.accounts.stake_account.amount* (x.percentage as u64))/100; // devided by hundred for testing
                msg!("new_amount {}",new_amount)
            }
        //     else{
        //         msg!("else case is running");
        //         new_amount=ctx.accounts.stake_account.amount + reward;
        // msg!("new_amount with reward: {}", new_amount);

        //     }
        }
        //reward according to stake tires end

        //not enough token in vault
        // if  new_amount > ctx.accounts.vault_account_pda.amount{
        //     return Err(ErrorCode::InsufficientRewardVault.into());
        // }

        //not enough token in vault end


        // let stake_holder2: &mut Account<StakeAccount>  = &mut ctx.accounts.stake_account;
        // stake_holder2.amount          = new_amount;

        // ctx.accounts.stake_account.amount = new_amount;

        msg!("ctx.accounts.stake_account.amount: {}",ctx.accounts.stake_account.amount);
        msg!("new_amount {}",new_amount);

    //   let dummy_ammount= 4000000000;
        ctx.accounts.stake_account.reload()?;
        // token::transfer(ctx.accounts.transfer_to_stake_ctx().with_signer(&[authority_seeds]),new_amount)?;
        // token::transfer(ctx.accounts.transfer_to_stake_ctx().with_signer(&[authority_seeds]),ctx.accounts.stake_account.amount)?;
        // token::transfer(ctx.accounts.transfer_to_stake_ctx().with_signer(&[authority_seeds]),(ctx.accounts.stake_account.amount/100)*95)?;
        token::transfer(ctx.accounts.transfer_to_stake_ctx().with_signer(&[authority_seeds]),(new_amount/100)*95)?;
        ctx.accounts.vault_account_pda.reload()?;
        msg!("remaining tokens after transfer_to_stake_ctx transaction: {}", ctx.accounts.vault_account_pda.amount);
       //testing
    //    ctx.accounts.admin_wallet.reload()?;
    // ctx.accounts.stake_account.reload()?;

    //     token::transfer(ctx.accounts.transfer_to_admin_ctx().with_signer(&[authority_seeds]),(ctx.accounts.stake_account.amount/100)*2)?;
        token::transfer(ctx.accounts.transfer_to_admin_ctx().with_signer(&[authority_seeds]),(new_amount/100)*2)?;
    //     ctx.accounts.vault_account_pda.reload()?;
    //     ctx.accounts.stake_account.reload()?;

    //     msg!("remaining tokens after transfer_to_admin_ctx transaction: {}", ctx.accounts.vault_account_pda.amount);
    //     token::transfer(ctx.accounts.transfer_to_liquidity_ctx().with_signer(&[authority_seeds]),(ctx.accounts.stake_account.amount/100)*2)?;
        token::transfer(ctx.accounts.transfer_to_liquidity_ctx().with_signer(&[authority_seeds]),(new_amount/100)*2)?;
    //     ctx.accounts.vault_account_pda.reload()?;
    //     ctx.accounts.stake_account.reload()?;

    //     msg!("remaining tokens after transfer_to_liquidity_ctx transaction: {}", ctx.accounts.vault_account_pda.amount);
    //     token::transfer(ctx.accounts.transfer_to_holders_ctx().with_signer(&[authority_seeds]),(ctx.accounts.stake_account.amount/100)*1)?;
        token::transfer(ctx.accounts.transfer_to_holders_ctx().with_signer(&[authority_seeds]),(new_amount/100)*1)?;
    //     ctx.accounts.vault_account_pda.reload()?;
    //     ctx.accounts.stake_account.reload()?;

        msg!("remaining tokens after transfer_to_holders_ctx transaction: {}", ctx.accounts.vault_account_pda.amount);
        ctx.accounts.stake_account.stake_status = false;
        Ok(())
    }
}


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateStakeVault<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init, 
    seeds = [b"stakeVault".as_ref()], bump,
    payer = signer, space = 8 + 64 + 64 + 40 + 32 )]
    pub vault_account: Account<'info, StakeVault>,
    #[account(init, payer = signer, space = 8 + 32 + 64 + 32 + 1)]
    pub vest_account: Account<'info, VestInfo>,
    pub rent: Sysvar<'info,Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeToken<'info> {
    #[account(init, payer = sender, space = 8 + 32 + 64 + 32 + 1)]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(mut)]
    pub sender: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub sender_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub receiver_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,

}

#[derive(Accounts)]
pub struct UnstakeToken<'info>{
    #[account(mut, has_one = from_address)]
    pub stake_account: Account<'info, StakeAccount>,
    pub from_address: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub vault_account_pda: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_account: Account<'info, TokenAccount>,
    /// CHECK:
    pub vault_authority: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    //added admin wallet testing
    // pub admin_wallet:Account<'info, StakeVault>,    
    pub vault_account: Account<'info, StakeVault>,

}


impl<'info> StakeToken<'info> {
    fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.sender_token.to_account_info(),
                to: self.receiver_token.to_account_info(),
                authority: self.sender.to_account_info(),
            },
        )
    }
}

impl<'info> UnstakeToken<'info>{
    fn transfer_to_stake_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.vault_account_pda.to_account_info(),
                to: self.user_account.to_account_info(),
                authority: self.vault_authority.to_account_info(),
            },
        )
    }
    //testing
    fn transfer_to_admin_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.vault_account_pda.to_account_info(),
                to: self.vault_account_pda.to_account_info(),
                authority: self.vault_authority.to_account_info(),
            },
        )
    }
    fn transfer_to_liquidity_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.vault_account_pda.to_account_info(),
                to: self.vault_account_pda.to_account_info(),
                authority: self.vault_authority.to_account_info(),
            },
        )
    }

    fn transfer_to_holders_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.vault_account_pda.to_account_info(),
                to: self.user_account.to_account_info(),
                authority: self.vault_authority.to_account_info(),
            },
        )
    }
}

#[account]
pub struct StakeVault {
    pub min_token:u64,
    pub max_token:u64,
    pub reward_duration: Vec<StakeTiers>,      
    pub min_lock_time:u32,   // considering minimum lock time in secs
//testing
    pub admin_wallet: Pubkey,    

}

#[account]
pub struct StakeAccount{
    pub from_address: Pubkey,
    pub stake_timestamp:i64,
    pub amount:u64,
    pub stake_status:bool,
    // pub holders:Vec<Holder>,

}

#[account]
pub struct VestInfo{
    pub start_timestamp:i64,
    pub vest_length:u64,
}


#[derive(Clone,Debug,AnchorSerialize, AnchorDeserialize)]
pub struct StakeTiers{
    pub days: u8,
    pub percentage: u32
}
// #[derive(Clone,Debug,AnchorSerialize, AnchorDeserialize)]
// pub struct Holder{
//     pub account: u64,
// }
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid Super Owner")]
    InvalidSuperOwner,

    #[msg("Tokens already staked.")]
    AlreadyStaked,

    #[msg("Tokens already un-staked.")]
    AlreadyUnStaked,

    #[msg("Invalid Withdraw Time")]
    InvalidWithdrawTime,

    #[msg("Insufficient Reward Token Balance")]
    InsufficientRewardVault,
}