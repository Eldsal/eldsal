import React from "react";
import moment from "moment";
import {
  Card, CardBody, CardTitle, CardSubtitle, CardText, Button
} from "reactstrap";


export const StripeSubscriptionComponent = ({ subscription }) => (
  <div>
    <Card>
      <CardBody>
        <CardTitle tag="h5">Subscription: {moment(subscription.current_period_start).toLocaleString()}</CardTitle>
        <CardSubtitle tag="h6" className="mb-2 text-muted">Card subtitle</CardSubtitle>
        <CardText>Some quick example text to build on the card title and make up the bulk of the card's content.</CardText>
        <Button>Button</Button>
      </CardBody>
    </Card>
  </div>
);

export default StripeSubscriptionComponent;
