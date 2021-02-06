import { useQuery } from "@apollo/client";
import { IonContent, IonPage } from "@ionic/react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import ContactsList from "../../components/ContactList";
import Toolbar from "../../components/Toolbar";
import CONTACTS from "../../graphql/contacts/queries/contacts";
import { RootState } from "../../redux/reducers";
import { indexContacts } from "../../utils/helpers";
import AddContactFAB from "./AddContact/AddContactFAB";
import AddContactModal from "./AddContact/AddContactModal";

const Contacts: React.FC = () => {
  const { contacts } = useSelector((state: RootState) => state.contacts);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  useQuery(CONTACTS, {
    onCompleted: (data) => {},
  });

  const indexedContacts = indexContacts(
    contacts.filter((contact) =>
      contact.username.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <IonPage>
      <Toolbar onChange={(e) => setSearch(e.detail.value!)} />
      <IonContent>
        <ContactsList contacts={indexedContacts} />
        <AddContactModal
          contacts={contacts}
          isOpen={isOpen}
          onCancel={() => setIsOpen(false)}
        />
        <AddContactFAB onClick={() => setIsOpen(true)} />
      </IonContent>
    </IonPage>
  );
};

export default Contacts;