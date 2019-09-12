import React from 'react'
import Modal from 'react-modal'
import Brancher from './Brancher'
import './Site.css'

const api = 'http://localhost:3000/api'

Modal.setAppElement('#app')


class Site extends React.Component {
    state = {
        auth: undefined,
        modal: false,
        incorrectPasswordMessage: false,
        passwordValue: '',
        data: undefined,
        active: undefined
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

    getFiles = async () => {
        const url = api + '/' + this.props.match.params.site + '/files'
        const headers = { headers: { Authorization: 'bearer ' + this.state.auth }}
        let fileList = await fetch(url, headers).then(response => response.json())
        this.setState({ data: fileList, openFilePath: undefined })

    }

    siteExists = async () => {
        const url = api + '/' + this.props.match.params.site
        console.log('url', url)
        const fetchResult = await fetch(url)
        if (fetchResult.status !== 200) {
            return console.error('siteExists failed', fetchResult)
        }
        return await fetchResult.json()
    }

    saveSite = async () => {
        console.log('saveSite')
        const modified = this.state.data.filter(file => file.modified || file.created || file.removed)
        console.log('modified', modified)
        if (modified.length === 0) {
            return
        }

        const url = api + '/' + this.props.match.params.site
        const headers = {
            method: 'PUT',
            headers: {
                'Authorization': 'bearer ' + this.state.auth,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(modified)
        }
        console.log(url, headers)
        const fetchResult = await fetch(url, headers)
        console.log(fetchResult.status)
    }

    newFiles = 0
    createFile = () => {
        const selected = this.state.data.find(file => file.selected)
        const parent = selected ? (selected.isFolder ? selected.id : selected.parent) : null
        const newFile = {
            id: this.state.data.reduce((acc, cur) => Math.max(cur.id, acc), 1) + 1,
            name: 'new_file_' + this.newFiles++,
            contents: '',
            parent,
            created: true,
            selected: true,
            active: true
        }
        const data = this.state.data.map(file => {
            if (file.id === parent) return {...file, selected: false, expanded: true}
            if (file.isFolder) return { ...file, selected: false }
            return { ...file, selected: false, active: false}
        }).concat(newFile)

        this.setState({ data })
    }

    createFolder = () => {
        console.log('createFolder')
        const selected = this.state.data.find(file => file.selected)
        console.log('selected', selected)
        const parent = selected ? (selected.isFolder ? selected.id : selected.parent) : null
        console.log('parent', parent)
        const newFolder = {
            id: this.state.data.reduce((acc, cur) => Math.max(cur.id, acc), 1) + 1,
            name: 'new_folder_' + this.newFiles++,
            isFolder: true,
            parent,
            created: true,
            selected: true,
            expanded: true
        }
        const data = this.state.data.map(file => {
            if (file.id === parent) {
                return { ...file, selected: false, expanded: true }
            }
            return { ...file, selected: false }
        }).concat(newFolder)
        console.log('data', data)
        this.setState({ data })
    }

    removeFile = () => {
        const selected = this.state.data.find(file => file.selected)
        if (!selected) return
        let remove = [selected.id]
        let data = this.state.data
        while (remove.length > 0) {
            const children = data.filter(file => remove.includes(file.parent))
            data = data.map(file => remove.includes(file.id) ? { ...file, removed: true } : file)
            remove = children
        }
        this.setState({data, active: undefined})

    }

    updateActive = (name) => (event) => {
        const data = this.state.data.map(file => {
            if (file.active) {
                return { ...file, [name]: event.target.value, modified: true }
            } else {
                return file
            }
        })
        this.setState({ data })
    }

    select = async (selected) => {
        console.log('select', selected)
        const file = this.state.data.find(file => file.id === selected)
        if (file.isFolder) return

        if (file.contents === undefined) {
            const url = api + '/' + this.props.match.params.site + '/files/' + selected
            const headers = {
                method: 'GET',
                headers: { Authorization: 'bearer ' + this.state.auth }
            }
            const fetchResult = await fetch(url, headers)
            if (fetchResult.status === 200) {
                const result = await fetchResult.json()
                const data = this.state.data.map(file => file.id === selected ? Object.assign({}, file, result, { active: true }) : file)
                this.setState({ data })
            }
        }
    }

    deselect = (event) => {
        if (event.target.className === 'navi' || event.target.className === 'navi-btns') {
            const data = this.state.data.map(file => {
                if (file.isFolder) {
                    return { ...file, selecte: false }
                } else {
                    return { ...file, selected: false, active: false }
                }
            })
            this.setState({ data })
        }
    }

    Modals = () => (
        <div className="Modals">
            <Modal isOpen={this.state.modal === 'login'}
                contentLabel={`Please log in to ${this.props.match.params.site}`}>
                {this.state.incorrectPasswordMessage ? <div>Incorrect Password!</div> : null}
                <h2>Log in to /{this.props.match.params.site}</h2>
                <form onSubmit={this.login}>
                    <input type="password"
                        value={this.state.passwordValue}
                        onChange={this.handlePasswordValueChange} />
                </form>
            </Modal>

            <Modal isOpen={this.state.modal === 'create'}>
                <h2>Create /{this.props.match.params.site}</h2>
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
        // console.log('render', this.state.data)
        if (this.state.data === undefined) return <this.Modals />
        // colors #425270 60ADD0 92ADC4 D8E6F3 57394D
        const activeFile = this.state.data.find(file => file.active) || { name: '', contents: '', disabled: true}
        return (
            <div className="Site">
                <div className="navi" onClick={this.deselect}>
                    <div className="navi-btns">
                        <button onClick={this.createFile}>new file</button>
                        <button onClick={this.createFolder}>new folder</button>
                        <button onClick={this.removeFile}>delete</button>
                        <button onClick={this.saveSite}>save</button>
                    </div>

                    <Brancher data={this.state.data}
                        setData={(data) => this.setState({ data })}
                        onSelect={this.select} />
                </div>
                <div>
                <input type="text" value={activeFile.name}
                    onChange={this.updateActive('name')}
                    disabled={activeFile.disabled} />
                <textarea value={activeFile.contents}
                    onChange={this.updateActive('contents')}
                    disabled={activeFile.disabled} />
                </div>

                <this.Modals />
            </div>

        )
    }
}

export default Site;
