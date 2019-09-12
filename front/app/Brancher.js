import React from 'react'
import './Brancher.css'
import { FaFileAlt, FaFolder, FaFolderOpen } from 'react-icons/fa'
import { TiFolder, TiFolderOpen, TiDocumentText } from 'react-icons/ti'

const Node = ({data, id, select}) => {
    const file = data.find(file => file.id === id)
    if (file.removed) return null
    const children = data.filter(file => file.parent === id)

    const Icon = (file.isFolder ? (file.expanded ? TiFolderOpen : TiFolder) : TiDocumentText)
    const classNames = 'name' + (file.selected ? ' selected' : '')

    return (
        <div className="brancher-node">
            <div className={classNames} onClick={select(file.id)}>
                <Icon size={30} className="icon" /> {file.name}
            </div>
            { file.expanded ?
            <div className="brancher-node-children">
                {children.map(file => <Node key={file.id} data={data} id={file.id} select={select} />)}
            </div>
            : null}
        </div>
        )
}

class Brancher extends React.Component {

    select = (id) => () => {
        const data = this.props.data.map(file => {
            if (file.id === id) {
                if (file.isFolder) {
                    return { ...file, selected: true, expanded: !file.expanded }
                } else {
                    return { ...file, selected: true }
                }
            } else {
                return { ...file, selected: false}
            }
        })
        this.props.setData(data)
        this.props.onSelect(id)
    }

    render () {
        const rootFiles = this.props.data.filter(x => x.parent === null)

        return (
            <div className="Brancher">
                { rootFiles.map(file => <Node key={file.id} data={this.props.data} id={file.id} select={this.select} />) }
            </div>
        )
    }
}

export default Brancher;
