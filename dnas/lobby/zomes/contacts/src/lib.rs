#![allow(unused_imports)]
#![allow(dead_code)]
use crate::utils::to_timestamp;
use contacts::Contact;
use entries::contacts;
use hdk3::prelude::*;

mod entries;
mod utils;

entry_defs![Contact::entry_def()];

#[hdk_extern]
fn add_contacts(agent_ids: Vec<AgentPubKey>) -> ExternResult<Vec<AgentPubKey>> {
    Ok(contacts::handlers::add_contacts(agent_ids)?)
}

#[hdk_extern]
fn remove_contacts(agent_ids: Vec<AgentPubKey>) -> ExternResult<Vec<AgentPubKey>> {
    Ok(contacts::handlers::remove_contacts(agent_ids)?)
}

#[hdk_extern]
fn block_contacts(agent_ids: Vec<AgentPubKey>) -> ExternResult<Vec<AgentPubKey>> {
    Ok(contacts::handlers::block_contacts(agent_ids)?)
}

#[hdk_extern]
fn unblock_contacts(agent_ids: Vec<AgentPubKey>) -> ExternResult<Vec<AgentPubKey>> {
    Ok(contacts::handlers::unblock_contacts(agent_ids)?)
}

#[hdk_extern]
fn list_added(_: ()) -> ExternResult<Vec<AgentPubKey>> {
    Ok(contacts::handlers::list_added()?)
}

#[hdk_extern]
fn list_blocked(_: ()) -> ExternResult<Vec<AgentPubKey>> {
    Ok(contacts::handlers::list_blocked()?)
}

#[hdk_extern]
fn in_contacts(agent_pubkey: AgentPubKey) -> ExternResult<bool> {
    Ok(contacts::handlers::in_contacts(agent_pubkey)?)
}

#[hdk_extern]
fn in_blocked(agent_pubkey: AgentPubKey) -> ExternResult<bool> {
    Ok(contacts::handlers::in_blocked(agent_pubkey)?)
}

pub fn error<T>(reason: &str) -> ExternResult<T> {
    Err(WasmError::Guest(String::from(reason)))
}
