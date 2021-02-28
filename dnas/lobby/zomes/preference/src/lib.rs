use hdk3::prelude::*;
mod entries;
use entries::preference::{self, handlers};

use preference::*;

entry_defs![
    Preference::entry_def(),
    PerAgentPreference::entry_def(),
    PerGroupPreference::entry_def()
];

pub fn error<T>(reason: &str) -> ExternResult<T> {
    Err(HdkError::Wasm(WasmError::Zome(String::from(reason))))
}

pub fn err<T>(code: &str, message: &str) -> ExternResult<T> {
    Err(HdkError::Wasm(WasmError::Zome(format!(
        "{{\"code\": \"{}\", \"message\": \"{}\"}}",
        code, message
    ))))
}

#[hdk_extern]
fn get_preference(_: ()) -> ExternResult<Preference> {
    Ok(Preference {
        ..handlers::fetch_preference()?.1
    })
}

#[hdk_extern]
fn set_preference(preference: PreferenceIO) -> ExternResult<Preference> {
    handlers::set_preference(preference)
}

#[hdk_extern]
fn set_per_agent_preference(preference: PerAgentPreferenceIO) -> ExternResult<PerAgentPreference> {
    handlers::set_per_agent_preference(preference)
}

#[hdk_extern]
fn get_per_agent_preference(_: ()) -> ExternResult<PerAgentPreference> {
    Ok(PerAgentPreference {
        ..handlers::fetch_per_agent_preference()?.1
    })
}

#[hdk_extern]
fn set_per_group_preference(preference: PerGroupPreferenceIO) -> ExternResult<PerGroupPreference> {
    handlers::set_per_group_preference(preference)
}

#[hdk_extern]
fn get_per_group_preference(_: ()) -> ExternResult<PerGroupPreference> {
    Ok(PerGroupPreference {
        ..handlers::fetch_per_group_preference()?.1
    })
}
