import React from 'react'
import Modal from 'react-modal'
import './Modals.css'

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

    pwdMismatch = () => this.state.input1 === '' || this.state.input1 !== this.state.input2

    siteMismatch = () => this.state.input1 !== this.props.site

    submitLogin = (event) => {
        event.preventDefault()
        this.props.controls.login(this.state.input1)
        this.setState({ input1: '' })
    }

    submitPasswordChange = (event) => {
        this.props.controls.changePassword(this.state.input1)
        this.setState({ input1: '', input2: '' })
    }

    submitDeleteSite = (event) => {
        this.props.controls.deleteSite()
        this.setState({ input1: '' })
    }

    render () {
        return (
            <div className="Modals">
                <Modal className="modal" isOpen={this.props.open === 'login'}
                    contentLabel={`Please log in to ${this.props.site}`}>
                    {this.props.msg ? <div>{this.props.msg}</div> : null}
                    <h2>Log in to /{this.props.site}</h2>
                    <form onSubmit={this.submitLogin}>
                        <input type="password"
                            value={this.state.input1}
                            onChange={this.handleChange('input1')} />
                    </form>
                </Modal>
                <Modal className="modal" isOpen={this.props.open === 'changePassword'} >
                    <h2>Change the password to /{this.props.site}</h2>
                    {this.props.msg ? <div>{this.props.msg}</div> : null}
                        <div className="input-row">
                            New password: <input type="password"
                                value={this.state.input}
                                onChange={this.handleChange('input1')} />
                        </div>
                        <div className="input-row">
                            Confirm password: <input type="password"
                                value={this.state.input2}
                                onChange={this.handleChange('input2')} />
                        </div>
                        <div className="button-row">
                            <button onClick={this.submitPasswordChange}
                                disabled={this.pwdMismatch()}>set new password</button>
                            <button onClick={this.props.controls.closeModal}>close</button>
                        </div>
                </Modal>

                <Modal className="modal" isOpen={this.props.open === 'confirm-delete'}>
                    <h2>Delete site /{this.props.site}</h2>
                    {this.props.msg ? <div>{this.props.msg}</div> : null}
                    <p>
                        Are you sure that you want to delete this site and all the files and folders in it?
                        <br />
                        The deleted content will be permanently lost.
                        <br />
                        To confirm this action, type the name of the site below:
                    </p>
                    <input type="text" value={this.state.input1} onChange={this.handleChange('input1')} />
                    <button onClick={this.submitDeleteSite}
                        disabled={this.siteMismatch()}>confirm</button>
                    <button onClick={this.props.controls.closeModal}>cancel</button>
                </Modal>
            </div>
        )
    }
}

export default Modals;
