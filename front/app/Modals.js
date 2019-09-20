import React from 'react'
import Modal from 'react-modal'

class Modals extends React.Component {
    state = {
        input1: '',
        input2: ''
    }

    login = () => {
        this.props.login(this.state.input)
        this.setState({ input: '' })
    }

    handleChange = (x) => (event) => this.setState({ [x]: event.target.value })

    pwdMismatch = () => {
        return this.state.input1 === '' || this.state.input1 !== this.state.input2
    }

    submitPasswordChange = (event) => {
        console.log('submit', this.state)
        event.preventDefault()
        if (this.state.input1 !== this.state.input2) {
            this.setState({ showPasswordMismatchMsg: true })
        } else {
            this.props.controls.changePassword(this.state.input1)
            this.setState({ input1: '', input2: '', showPasswordMismatchMsg: false })
        }
    }

    render () {
        return (
            <div className="Modals">
                <Modal isOpen={this.props.open === 'changePassword'} >
                    <h2>Enter new password to /{this.props.site}</h2>
                    {this.props.msg ? <div>{this.props.msg}</div> : null}
                        <input type="password"
                            value={this.state.input}
                            onChange={this.handleChange('input1')} />
                        <br />
                        <input type="password"
                            value={this.state.input2}
                            onChange={this.handleChange('input2')} />
                        <br />
                        <button onClick={this.submitPasswordChange}
                            disabled={this.pwdMismatch()}>set new password</button>
                        <button onClick={this.props.controls.closeModal}>close</button>
                </Modal>
            </div>
        )
    }
}

export default Modals;
