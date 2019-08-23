import React from 'react'
import Modal from 'react-modal'
import axios from 'axios'
import TreeView from 'deni-react-treeview'
import './Site.css'

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
        incorrectPasswordMessage: false,
        passwordValue: '',
        data: [],
        contents: ''
    }

    async componentDidMount() {
        const site = this.props.match.params.site
        const siteExists = await this.siteExists(site)
        const token = window.sessionStorage.getItem
        if (siteExists === undefined) {
            this.setState({ modal: 'error' })
        } else if (siteExists) {
            const token = window.sessionStorage.getItem(`${site}_token`)
            if (token) {
                this.setState({ auth: token }, this.getFiles)
            } else {
                this.setState({ modal: 'login' })
            }
        } else {
            this.setState({ modal: 'create' })
        }

    }

    handlePasswordValueChange = (event) => this.setState({ passwordValue: event.target.value })
    openModal = (type) => () => this.setState({ modal: type })
    closeModal = () => this.setState({ modal: false, incorrectPasswordMessage: false })
    login = (event) => {
        event.preventDefault()
        axios.post(`${api}/${this.props.match.params.site}/login`, { password: this.state.passwordValue })
            .then(response => {
                if (response.status === 200) {
                    window.sessionStorage.setItem(this.props.match.params.site + '_token', response.data.token)
                    this.setState({ auth: response.data.token }, this.getFiles)
                    this.closeModal()
                }
            })
            .catch(error => {
                if (error.response.status === 401) {
                    this.setState({ incorrectPasswordMessage: true })
                }
            })
    }
    create = (event) => {
        event.preventDefault()
        console.log('create site', this.props.match.params.site )
        this.closeModal()
    }

    getFiles = () => {
        axios.get(`${api}/${this.props.match.params.site}/files`, { headers: { Authorization: 'bearer ' + this.state.auth }})
            .then(response => {
                let idCounter = 0
                let data = []
                const files = response.data

                files.forEach(file => {
                    console.log('processing file ', file)
                    const folders = file.path.split('/').slice(1, -1)
                    let node = data
                    folders.forEach(folder => {
                        let match = node.find(item => item.name === folder)
                        if (!match) {
                            match = {
                                id: idCounter++,
                                text: folder,
                                children: []
                            }
                            node.push(match)
                        }
                        node = match.children
                    })
                    node.push({
                        id: file.id,
                        text: file.name,
                        isLeaf: true
                    })
                    console.log('node', node)
                    console.log('data', data)
                    console.log('idCounter', idCounter)
                })
                this.setState({ data })
            })
    }

    siteExists = (site) => axios.get(`${api}/${site}`)
            .then(response => response.data)
            .catch(error => console.error(error))

    Modals = () => (
        <div className="Modals">
            <Modal isOpen={this.state.modal === 'login'}
                contentLabel={`Please log in to ${this.state.name}`}>
                {this.state.incorrectPasswordMessage ? <div>Incorrect Password!</div> : null}
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

    onSelectItem = (item) => {
        if (!item.isLeaf) return undefined
        axios.get(`${api}/${this.props.match.params.site}/files/${item.id}`, { headers: { Authorization: 'bearer ' + this.state.auth }})
            .then(result => {
                this.setState({contents: result.data})
            })
        console.log('onSelectItem', item)
    }

    handleChange = (event) => this.setState({ contents: event.target.value })

    render () {
        // colors #425270 60ADD0 92ADC4 D8E6F3 57394D
        return (
            <div className="Site">
                <TreeView className="navi-tree"
                    theme="metro"
                    items={this.state.data}
                    onSelectItem={this.onSelectItem} />

                <textarea value={this.state.contents}
                    onChange={this.handleChange}/>

                <this.Modals />
            </div>

        )
    }
}

export default Site;
