function getInitials(name) {
  return String(name || '').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'
}

function ProfileAvatar({ name = '', imageUrl = '', className = '' }) {
  return (
    <span className={`profile-avatar${className ? ` ${className}` : ''}`} aria-hidden="true">
      {imageUrl ? <img src={imageUrl} alt="" /> : getInitials(name)}
    </span>
  )
}

export default ProfileAvatar
