import React from 'react'
import './Brancher.css'
import { FaFileAlt, FaFolder, FaFolderOpen } from 'react-icons/fa'
import { TiFolder, TiFolderOpen, TiDocumentText, TiEdit, TiDelete } from 'react-icons/ti'



class Brancher extends React.Component {
    state = {
        nameEditorOpen: undefined,
        nameEditorValue: ''
    }

    Node = ({data, id, controls}) => {
        const file = data.find(file => file.id === id)
        if (file.removed) return null
        const children = data.filter(file => file.parent === id)

        const Icon = (file.isFolder ? (file.expanded ? TiFolderOpen : TiFolder) : TiDocumentText)
        const classNames = 'name' + (file.selected ? ' selected' : '')

        return (
            <div className="brancher-node">
                <div className={classNames}>
                    <div className="name-left" onClick={controls.select(file)}>
                        <Icon size={36} className="icon" />
                        {
                            this.state.nameEditorOpen === file.id
                            ? <form onSubmit={controls.changeName}>
                                <input type="text"
                                    value={this.state.nameEditorValue}
                                    onChange={controls.nameEditorValueChange} />
                            </form>
                            : file.name
                        }
                    </div>
                    { file.selected ?
                    <div className="name-right">
                        <TiEdit className="action-icon" onClick={controls.edit(file)} />
                        <TiDelete className="action-icon" onClick={controls.delete(file)} />
                    </div>
                    : null }


                </div>
                { file.expanded ?
                <div className="brancher-node-children">
                    {children.map(file => <this.Node key={file.id} data={data} id={file.id} controls={controls} />)}
                </div>
                : null}
            </div>
            )
    }

    controls = {
        select: ({id, isFolder}) => () => {
            const data = this.props.data.map(file => {
                if (file.isFolder) {
                    if (file.id === id) {
                        return { ...file, selected: true, expanded: !file.expanded }
                    } else {
                        return { ...file, selected: false }
                    }
                } else {
                    if (file.id === id) {
                        return { ...file, selected: true, active: isFolder ? file.active : true }
                    } else {
                        return { ...file, selected: false, active: isFolder ? file.active : false }
                    }
                }
            })
            this.props.setData(data)
            this.props.onSelect(id)
        },
        edit: ({id, name}) => () => {
            console.log('edit', id)
            this.setState({ nameEditorOpen: id, nameEditorValue: name })
        },
        delete: (id) => () => {
            let remove = [id]
            let data = this.props.data
            while (remove.length > 0) {
                const children = data.filter(file => remove.includes(file.parent))
                data = data.map(file => remove.includes(file.id) ? { ...file, removed: true } : file)
                remove = children
            }
            this.props.setData(data)
        },
        nameEditorValueChange: (event) => this.setState({ nameEditorValue: event.target.value }),
        changeName: (event) => {
            event.preventDefault()
            const data = this.props.data.map(file => {
                if (file.id === this.state.nameEditorOpen) {
                    return { ...file, name: this.state.nameEditorValue}
                } else {
                    return file
                }
            })
            this.props.setData(data)
            this.setState({ nameEditorOpen: null, nameEditorValue: undefined })
        }
    }


    render () {
        const rootFiles = this.props.data.filter(x => x.parent === null)

        return (
            <div className="Brancher">
                { rootFiles.map(file => <this.Node key={file.id} data={this.props.data} id={file.id} controls={this.controls} />) }
            </div>
        )
    }
}

export default Brancher;
