import { BigInt } from "@graphprotocol/graph-ts";
import {
  Contract,
  Approval,
  Burn,
  DelegateChanged,
  DelegateVotesChanged,
  LogNote,
  LogSetAuthority,
  LogSetOwner,
  Mint,
  Transfer,
} from "../generated/Contract/Contract";
import {
  User,
  BalanceHistory,
  VotingPowerHistory,
  Block,
} from "../generated/schema";

export function handleApproval(event: Approval): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  /* let entity = ExampleEntity.load(event.transaction.from.toHex());

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from.toHex());

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0);
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count.plus(BigInt.fromI32(1));
  // Entity fields can be set based on event parameters
  entity.src = event.params.src;
  entity.guy = event.params.guy;

  // Entities can be written to the store with `.save()`
  entity.save();*/
  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.
  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.DELEGATION_TYPEHASH(...)
  // - contract.DOMAIN_TYPEHASH(...)
  // - contract.allowance(...)
  // - contract.approve(...)
  // - contract.approve(...)
  // - contract.authority(...)
  // - contract.balanceOf(...)
  // - contract.checkpoints(...)
  // - contract.decimals(...)
  // - contract.delegates(...)
  // - contract.getCurrentVotes(...)
  // - contract.getPriorVotes(...)
  // - contract.name(...)
  // - contract.nonces(...)
  // - contract.numCheckpoints(...)
  // - contract.owner(...)
  // - contract.stopped(...)
  // - contract.symbol(...)
  // - contract.totalSupply(...)
  // - contract.transfer(...)
  // - contract.transferFrom(...)
}

export function handleBurn(event: Burn): void {
  let user = User.load(event.params.guy.toHex());
  if (user) {
    user.balance = user.balance.minus(event.params.wad);

    let contract = Contract.bind(event.address);
    let block = new Block(event.block.hash.toHex());
    block.number = event.block.number;
    block.at = event.block.timestamp;
    block.totalSupply = contract.totalSupply();

    let bHistory = BalanceHistory.load(block.id.concat(user.id));
    if (!bHistory) {
      bHistory = new BalanceHistory(block.id.concat(user.id));
    }
    bHistory.user = user.id;
    bHistory.amount = user.balance;
    bHistory.block = block.id;

    block.save();
    user.save();
    bHistory.save();
  }

  /*if (!user) {
    user = new User(event.params.guy.toHex());
    user.balance = user.balance.minus(event.params.wad);
    user.votingPower = BigInt.fromI32(0);
  }*/
}

export function handleDelegateChanged(event: DelegateChanged): void {}

export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  let user = User.load(event.params.delegate.toHex());
  if (!user) {
    user = new User(event.params.delegate.toHex());
    user.balance = BigInt.fromI32(0);
  }
  user.votingPower = event.params.newBalance;

  let contract = Contract.bind(event.address);
  let block = new Block(event.block.hash.toHex());
  block.number = event.block.number;
  block.at = event.block.timestamp;
  block.totalSupply = contract.totalSupply();

  let vpHistory = VotingPowerHistory.load(block.id.concat(user.id));
  if (!vpHistory) {
    vpHistory = new VotingPowerHistory(block.id.concat(user.id));
  }

  vpHistory.user = user.id;
  vpHistory.amount = user.votingPower;
  vpHistory.block = block.id;

  block.save();
  vpHistory.save();
  user.save();
}

export function handleLogNote(event: LogNote): void {}

export function handleLogSetAuthority(event: LogSetAuthority): void {}

export function handleLogSetOwner(event: LogSetOwner): void {}

export function handleMint(event: Mint): void {
  let user = User.load(event.params.guy.toHex());
  if (!user) {
    user = new User(event.params.guy.toHex());
    user.votingPower = BigInt.fromI32(0);
    user.balance = BigInt.fromI32(0);
  }
  user.balance = user.balance.plus(event.params.wad);

  let contract = Contract.bind(event.address);
  let block = new Block(event.block.hash.toHex());
  block.number = event.block.number;
  block.at = event.block.timestamp;
  block.totalSupply = contract.totalSupply();

  let bHistory = BalanceHistory.load(block.id.concat(user.id));
  if (!bHistory) {
    bHistory = new BalanceHistory(block.id.concat(user.id));
  }

  bHistory.user = user.id;
  bHistory.amount = user.balance;
  bHistory.block = block.id;

  user.save();
  block.save();
  bHistory.save();
}

export function handleTransfer(event: Transfer): void {
  let contract = Contract.bind(event.address);
  let block = new Block(event.block.hash.toHex());
  block.at = event.block.timestamp;
  block.number = event.block.number;
  block.totalSupply = contract.totalSupply();
  block.save();

  let receiver = User.load(event.params.dst.toHex());
  if (!receiver) {
    receiver = new User(event.params.dst.toHex());
    receiver.balance = BigInt.fromI32(0);
    receiver.votingPower = BigInt.fromI32(0);
  }
  receiver.balance = receiver.balance.plus(event.params.wad);
  receiver.save();

  let bHistoryRecv = BalanceHistory.load(block.id.concat(receiver.id));
  if (!bHistoryRecv) {
    bHistoryRecv = new BalanceHistory(block.id.concat(receiver.id));
  }
  bHistoryRecv.user = receiver.id;
  bHistoryRecv.amount = receiver.balance;
  bHistoryRecv.block = block.id;
  bHistoryRecv.save();

  let sender = User.load(event.params.src.toHex());
  if (sender) {
    sender.balance = sender.balance.minus(event.params.wad);
    sender.save();
    let bHistorySender = BalanceHistory.load(block.id.concat(sender.id));
    if (!bHistorySender) {
      bHistorySender = new BalanceHistory(block.id.concat(sender.id));
    }

    let contract = Contract.bind(event.address);
    contract.totalSupply;
    bHistorySender.user = sender.id;
    bHistorySender.amount = sender.balance;
    bHistorySender.block = block.id;
    bHistorySender.save();
  }
}
