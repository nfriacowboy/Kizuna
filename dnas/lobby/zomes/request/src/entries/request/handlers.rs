use super::{
    Claims, 
    Grants, 
    BooleanWrapper, 
    ClaimFrom
};
use hdk3::prelude::*;
use hdk3::host_fn::call::call;
use hex;

pub(crate) fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let mut functions: GrantedFunctions = HashSet::new();
    functions.insert((zome_info!()?.zome_name, "receive_request_to_chat".into()));

    create_cap_grant!(CapGrantEntry {
        tag: "receive_request_to_chat".into(),
        access: ().into(),
        functions,
    })?;

    Ok(InitCallbackResult::Pass)
}

pub(crate) fn get_cap_claims(_: ()) -> ExternResult<Claims> {
    let query_result = query!(
        QueryFilter::new()
        .entry_type(EntryType::CapClaim)
        .include_entries(true)
    )?;

    let result: Vec<CapClaim> = query_result
        .0
        .into_iter()
        .filter_map(|e| 
            match e.header() {
                // avoid using unwrap.
                Header::Create(_create) => Some(e.clone().into_inner().1.into_option().unwrap().as_cap_claim().unwrap().to_owned()),
                // TODO: handle updated and deleted CapClaims when the need arises.
                _ => None,
            })
        .collect();

    Ok(Claims(result))
}

pub(crate) fn get_cap_grants(_: ()) -> ExternResult<Grants> {
    let query_result = query!(
        QueryFilter::new()
        .entry_type(EntryType::CapGrant)
        .include_entries(true)
    )?;

    let result: Vec<CapGrant> = query_result
        .0
        .into_iter()
        .filter_map(|e| 
            match e.header() {
                // avoid using unwrap.
                Header::Create(_create) => Some(e.clone().into_inner().1.into_option().unwrap().as_cap_grant().unwrap().to_owned()),
                // TODO: handle updated and deleted CapClaims when the need arises.
                _ => None,
            })
        .collect();

    Ok(Grants(result))
}

pub(crate) fn send_request_to_chat(agent: AgentPubKey) -> ExternResult<HeaderHash> {
    // create a grant and claim to receive message from the receiver
    let cap_claim = create_cap_grant_and_return_claim(agent.clone())?;
    let my_key = agent_info!()?.agent_latest_pubkey;
    let claim_from = ClaimFrom(cap_claim, my_key);

    match call_remote!(
        agent.clone(),
        zome_info!()?.zome_name,
        "receive_request_to_chat".to_string().into(),
        None,
        claim_from.try_into()?
    )? {
        ZomeCallResponse::Ok(payload) => {
            let claim: CapClaim = payload.into_inner().try_into()?;
            Ok(create_cap_claim!(claim)?)
        },
        ZomeCallResponse::Unauthorized => Err(HdkError::Wasm(WasmError::Zome(
            "{\"code\": \"000\", \"message\": \"[Unauthorized] Accept Request\"}".to_owned(),
        )))
    }
}


pub(crate) fn receive_request_to_chat(claim_from: ClaimFrom) -> ExternResult<CapClaim> {
    // commit the claim received from sender
    create_cap_claim!(claim_from.0)?;    
    let in_contacts = match call(
        agent_info!()?.agent_latest_pubkey,
        "contacts".into(),
        "in_contacts".into(),
        None,
        claim_from.1.clone().try_into()?
    )? {
        ZomeCallResponse::Ok(output) => {
            let bool_wrapper: BooleanWrapper = output.into_inner().try_into()?;
            Ok(bool_wrapper)
        },
        ZomeCallResponse::Unauthorized => crate::error("unauthorized access")
    };
    if let true = in_contacts?.0 {
        Ok(create_cap_grant_and_return_claim(claim_from.1)?)
    } else {
        // currently blocks any attempt to message if not in conctacts.
        crate::error("agent is not in the contacts")
    }
}

fn create_cap_grant_and_return_claim(agent: AgentPubKey) -> ExternResult<CapClaim> {

    debug!(format!("the agentpubkey is {:?}", hex::encode(agent.get_core_bytes())))?;

    let mut functions: GrantedFunctions = HashSet::new();
    functions.insert(("p2pmessage".into(), "receive_message".into()));
    let secret = generate_cap_secret!()?;

    create_cap_grant!(CapGrantEntry {
        access: (secret, agent.clone()).into(),
        functions,
        tag: String::from(format!(
            "grant_to_receive_message_from_{}", 
            hex::encode(agent.get_core_bytes())
        )),
    })?;

    let tag = String::from(format!(
        "claim_to_send_message_to_{}", 
        hex::encode(agent_info!()?.agent_latest_pubkey.get_core_bytes())
    ));
    Ok(CapClaim::new(tag, agent_info!()?.agent_latest_pubkey, secret))
}
