import { IonButton, IonButtons, IonIcon } from "@ionic/react";
import { pencil } from "ionicons/icons";
import React from "react";

interface Props {
  onClickEdit: () => void;
  onClickNotif: () => void;
  disabled: boolean;
}

const EndButtons: React.FC<Props> = ({onClickEdit, onClickNotif, disabled}) => (
  <IonButtons slot="end">
    <>
      <IonButton onClick={onClickEdit} disabled={disabled ? true : false}>
        <IonIcon color="medium" icon={pencil} />
      </IonButton>
      {/* <IonButton onClick={onClickNotif}>
        <IonIcon color="medium" icon={notifications} />
      </IonButton> */}
    </>
  </IonButtons>
);

export default EndButtons;
