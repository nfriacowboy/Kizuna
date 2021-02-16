use super::error;
use hdk3::prelude::*;
use std::time::Duration;
use timestamp::Timestamp;

pub(crate) fn to_timestamp(duration: Duration) -> Timestamp {
    Timestamp(duration.as_secs() as i64, duration.subsec_nanos())
}

pub(crate) fn get_my_blocked_list() -> ExternResult<Vec<AgentPubKey>> {
    //call list_blocked() to contacts zome
    let zome_name: ZomeName = ZomeName("contacts".to_owned());
    let function_name: FunctionName = FunctionName("list_blocked".to_owned());

    let maybe_my_blocked_list: ZomeCallResponse = call(
        None, // The cell you want to call (If None will call the current cell).
        zome_name,
        function_name,
        None, //The capability secret if required.
        &(),  //This are the input value we send to the fuction we are calling
    )?;

    match maybe_my_blocked_list {
        ZomeCallResponse::Ok(payload) => {
            let my_blocked_list: Vec<AgentPubKey> = payload.decode()?;
            return Ok(my_blocked_list);
        }
        ZomeCallResponse::Unauthorized(_, _, _, _) => {
            // this case should not happen
            error("unexpected error. Unauthorized function even if self is calling.")
        }
        ZomeCallResponse::NetworkError(error_msg) => error(&error_msg),
    }
}
