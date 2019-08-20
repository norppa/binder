import React from 'react'
import Modal from 'react-modal'
import axios from 'axios'

const api = 'http://localhost:3000/api'

const Empty = () => null
const Create = () => <div>create</div>
const Authorized = () => <div>authorized</div>
Modal.setAppElement('#app')

class Site extends React.Component {
    state = {
        auth: undefined,
        name: this.props.match.params.site,
        modal: false,
        loginModalOpen: false,
        createModalOpen: false,
        passwordValue: ''
    }

    handlePasswordValueChange = (event) => this.setState({ passwordValue: event.target.value })
    openModal = (type) => () => this.setState({ modal: type })
    closeModal = () => this.setState({ modal: false })
    login = (event) => {
        event.preventDefault()
        console.log('log in to site', this.props.match.params.site )
        this.closeModal()
    }
    create = (event) => {
        event.preventDefault()
        console.log('create site', this.props.match.params.site )
        this.closeModal()
    }

    async componentDidMount() {
        const siteExists = await this.siteExists(this.props.match.params.site)
        console.log('site exists', siteExists)
        if (siteExists === undefined) {
            this.setState({ modal: 'error' })
        } else if (siteExists) {
            this.setState({ modal: 'login' })
        } else {
            this.setState({ modal: 'create' })
        }

    }

    siteExists = (site) => axios.get(`${api}/${site}`)
            .then(response => response.data)
            .catch(error => console.error(error))

    Modals = () => (
        <div className="Modals">
            <Modal isOpen={this.state.modal === 'login'}
                contentLabel={`Please log in to ${this.state.name}`}>
                <h2>Log in to /{this.state.name}</h2>
                <form onSubmit={this.login}>
                    <input type="password"
                        value={this.state.passwordValue}
                        onChange={this.handlePasswordValueChange} />
                </form>
            </Modal>

            <Modal isOpen={this.state.modal === 'create'}>
                <h2>Create /{this.state.name}</h2>
                <form onSubmit={this.create}>
                    <input type="password"
                        value={this.state.passwordValue}
                        onChange={this.handlePasswordValueChange} />
                </form>
            </Modal>

            <Modal isOpen={this.state.modal === 'error'}>
                <h2>There was an error!</h2>
            </Modal>
        </div>
    )

    render () {
        return (
            <div className="Site">
                Site

                <this.Modals />
            </div>

        )
    }
}

export default Site;
