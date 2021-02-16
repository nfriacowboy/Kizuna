use hdk3::prelude::timestamp::Timestamp;
use hdk3::prelude::*;

pub mod handlers;

//GROUP TYPE DEFINITION, GETTERS, SETTERS, ENTRY_DEF, UTILS ...
#[derive(Serialize, Deserialize, Clone, Debug, SerializedBytes)]
pub struct Group {
    pub name: String,
    pub created: Timestamp,
    pub creator: AgentPubKey,
    pub members: Vec<AgentPubKey>,
}

impl Group {
    pub fn new(
        name: String,
        created: Timestamp,
        creator: AgentPubKey,
        members: Vec<AgentPubKey>,
    ) -> Self {
        Group {
            name,
            created,
            creator,
            members,
        }
    }
    //GETTERS
    pub fn get_group_creation_timestamp(&self) -> Timestamp {
        self.created.clone()
    }
    pub fn get_group_creator(&self) -> AgentPubKey {
        self.creator.clone()
    }
    pub fn get_group_members(&self) -> Vec<AgentPubKey> {
        self.members.clone()
    }
}

entry_def!(Group
    EntryDef{
        id: "group".into(),
        visibility: EntryVisibility::Public,
        crdt_type: CrdtType,
        required_validations: RequiredValidations::default(),
        required_validation_type: RequiredValidationType::Element
    }
);
//END OF GROUP TYPE DEFINITION

// IO TYPES DEFINITION
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UpdateMembersIO {
    pub members: Vec<AgentPubKey>,
    pub group_id: EntryHash,
    pub group_revision_id: HeaderHash,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UpdateGroupNameIO {
    name: String,
    group_id: EntryHash,
    group_revision_id: HeaderHash,
}
// END OF IO TYPES DEFINITION

//INPUTS TYPES DEFINITION
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateGroupInput {
    name: String,
    members: Vec<AgentPubKey>,
}
//END OF INPUTS TYPES DEFINITION

//OUTPUTS TYPES DEFINITION
#[derive(Deserialize, Serialize, Debug)]
pub struct CreateGroupOutput {
    pub content: Group,
    pub group_id: EntryHash,
    pub group_revision_id: HeaderHash,
}
#[derive(Deserialize, Serialize, Debug)]
pub struct GroupOutput {
    group_id: EntryHash,
    group_revision_id: HeaderHash,
    latest_name: String,
    members: Vec<AgentPubKey>,
    creator: AgentPubKey,
    created: Timestamp,
    // group_versions: Vec<Group>,
}

impl GroupOutput {
    fn new(group: Group, group_id: EntryHash, group_revision_id: HeaderHash) -> GroupOutput {
        GroupOutput {
            group_id: group_id,
            group_revision_id: group_revision_id,
            latest_name: group.name,
            members: group.members,
            creator: group.creator,
            created: group.created,
        }
    }
}
//END OF OUTPUTS TYPES DEFINITION

//VALIDATION TYPES DEFINITION (this types are created just for testing purposes and can be removed in the future)
#[derive(Deserialize, Serialize, Debug)]
pub struct ValidationInput {
    pub validation_type: String,
    pub group_revision_id: HeaderHash,
}
//END OF VALIDATION TYPES DEFINITION
