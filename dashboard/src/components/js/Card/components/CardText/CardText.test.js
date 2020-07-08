import React from "react";
import { shallow } from "enzyme";
import CardText from ".";

describe(CardText, () => {
  it("renders the content correctly", () => {
    const text = "My Text";
    const wrapper = shallow(<CardText>{text}</CardText>);

    expect(wrapper).toHaveText(text);
    expect(wrapper).toMatchSnapshot();
  });

  it("includes the expected CSS class", () => {
    const wrapper = shallow(<CardText>Test</CardText>);
    expect(wrapper).toHaveClassName("card-text");
  });
});
