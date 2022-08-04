import React from 'react';
import OverlayScrollbars from 'overlayscrollbars';

export class OverlayScrollbarsTextarea extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: props.value };
        this.handleChange = this.handleChange.bind(this);
        this.osTargetRef = React.createRef();
    }

    componentDidMount() {
        this.osInstance = OverlayScrollbars(this.osTargetRef.current, this.props.options || {}, this.props.extensions);
    }

    componentWillUnmount() {
        if (OverlayScrollbars.valid(this.osInstance)) {
            this.osInstance.destroy();
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({ value: this.props.value });
        }
    }

    handleChange(event) {
        this.props.onChange(event.target.value)
        this.setState({ value: event.target.value });
    }

    render() {
        return <textarea {...this.props} value={this.state.value} ref={this.osTargetRef} onChange={this.handleChange} />;
    }
}