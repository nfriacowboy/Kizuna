use hdk::prelude::*;

use file_types::PayloadType;
use std::collections::hash_map::HashMap;

use super::get_next_batch_group_messages::get_next_batch_group_messages_handler;

use super::{
    BatchSize,
    MessagesByGroup,
    GroupMessageHash,
    GroupMessageContent,
    GroupMessagesOutput,
    GroupMessagesContents,
    GroupMsgBatchFetchFilter
};

pub fn get_latest_messages_for_all_groups_handler( batch_size: BatchSize) -> ExternResult<GroupMessagesOutput> {
    let batch_size: u8 = batch_size.0;

    // initialize MessagesByGroup
    let mut messages_by_group: HashMap<String, Vec<GroupMessageHash>> = HashMap::new();

    // initialize GroupMessagesContents HashMap
    let mut messages_contents: HashMap<String, GroupMessageContent> = HashMap::new();

    // get_links agent_pubkey->group|member| (group_hash)
    let agent_pub_key: AgentPubKey = agent_info()?.agent_latest_pubkey;
    let linked_groups_to_the_agent: Vec<EntryHash> =
        get_links(agent_pub_key.into(), Some(LinkTag::new("member")))?
            .into_inner()
            .into_iter()
            .map(|link_to_group| -> EntryHash { link_to_group.target })
            .collect();

    //for each group in the list call fetch_next_batch_group_messages() with payload_type All last_fetched/last_message_timestamp as None

    for group_id in linked_groups_to_the_agent.into_iter() {
        let batch_filter: GroupMsgBatchFetchFilter = GroupMsgBatchFetchFilter {
            group_id: group_id,
            last_fetched: None,
            last_message_timestamp: None,
            batch_size: batch_size.clone(),
            payload_type: PayloadType::All,
        };

        let mut messages_output: GroupMessagesOutput = get_next_batch_group_messages_handler(batch_filter)?;

        // insert GroupMessagesContents and MessagesByGroup values from returned GroupMessagesOutput into the initialized MessagesByGroup and GroupMessagesContents
        for (key, value) in messages_output.messages_by_group.0.drain() {
            messages_by_group.insert(key, value);
        }

        for (key, value) in messages_output.group_messages_contents.0.drain() {
            messages_contents.insert(key, value);
        }
    }

    // construct GroupMessagesOutput

    let output: GroupMessagesOutput = GroupMessagesOutput {
        messages_by_group: MessagesByGroup(messages_by_group),
        group_messages_contents: GroupMessagesContents(messages_contents),
    };

    Ok(output)
}