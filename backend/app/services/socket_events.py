from flask import request
from flask_socketio import emit, join_room, leave_room
from app.models import db, Message, Channel, User, Whiteboard
import json

def register_socket_events(socketio):
    # Connected clients tracker
    connected_users = {}  # sid -> user_id

    @socketio.on("connect")
    def handle_connect():
        pass

    @socketio.on("disconnect")
    def handle_disconnect():
        sid = request.sid
        if sid in connected_users:
            user_id = connected_users.pop(sid)
            emit("user_presence", {"user_id": user_id, "status": "offline"}, broadcast=True)

    @socketio.on("authenticate")
    def handle_authenticate(data):
        user_id = data.get("user_id")
        if user_id:
            connected_users[request.sid] = user_id
            join_room(f"user_{user_id}")
            emit("user_presence", {"user_id": user_id, "status": "online"}, broadcast=True)
            emit("authenticated", {"status": "ok", "user_id": user_id})

    # ================= CHANNEL & CHAT EVENTS =================
    @socketio.on("join_channel")
    def handle_join_channel(data):
        channel_id = data.get("channel_id")
        if channel_id:
            room = f"channel_{channel_id}"
            join_room(room)
            emit("channel_joined", {"channel_id": channel_id, "user_id": data.get("user_id")}, to=room)

    @socketio.on("leave_channel")
    def handle_leave_channel(data):
        channel_id = data.get("channel_id")
        if channel_id:
            room = f"channel_{channel_id}"
            leave_room(room)
            emit("channel_left", {"channel_id": channel_id, "user_id": data.get("user_id")}, to=room)

    @socketio.on("send_message")
    def handle_send_message(data):
        channel_id = data.get("channel_id")
        sender_id = data.get("sender_id")
        content = data.get("content")
        parent_id = data.get("parent_id")
        message_type = data.get("message_type", "text")
        attachments = data.get("attachments", [])

        if not channel_id or not sender_id or not content:
            return

        msg = Message(
            channel_id=channel_id,
            sender_id=sender_id,
            content=content,
            parent_id=parent_id,
            message_type=message_type,
            attachments=json.dumps(attachments)
        )
        db.session.add(msg)
        db.session.commit()

        msg_dict = msg.to_dict()
        room = f"channel_{channel_id}"
        emit("new_message", msg_dict, to=room)

    @socketio.on("typing")
    def handle_typing(data):
        channel_id = data.get("channel_id")
        user_id = data.get("user_id")
        user_name = data.get("user_name")
        is_typing = data.get("is_typing", True)
        if channel_id:
            emit("user_typing", {
                "channel_id": channel_id,
                "user_id": user_id,
                "user_name": user_name,
                "is_typing": is_typing
            }, to=f"channel_{channel_id}", include_self=False)

    # ================= WEBRTC MEETING SIGNALING =================
    @socketio.on("join_meeting")
    def handle_join_meeting(data):
        room_code = data.get("room_code")
        user_info = data.get("user")
        if room_code:
            room = f"meeting_{room_code}"
            join_room(room)
            emit("meeting_user_joined", {
                "sid": request.sid,
                "user": user_info
            }, to=room, include_self=False)

    @socketio.on("meeting_signal")
    def handle_meeting_signal(data):
        target_sid = data.get("target_sid")
        signal_data = data.get("signal")
        sender_info = data.get("user")
        room_code = data.get("room_code")
        
        payload = {
            "sender_sid": request.sid,
            "signal": signal_data,
            "user": sender_info
        }
        if target_sid:
            emit("meeting_signal", payload, to=target_sid)
        elif room_code:
            emit("meeting_signal", payload, to=f"meeting_{room_code}", include_self=False)

    @socketio.on("leave_meeting")
    def handle_leave_meeting(data):
        room_code = data.get("room_code")
        if room_code:
            room = f"meeting_{room_code}"
            leave_room(room)
            emit("meeting_user_left", {"sid": request.sid}, to=room)

    # ================= COLLABORATIVE WHITEBOARD =================
    @socketio.on("join_whiteboard")
    def handle_join_whiteboard(data):
        board_id = data.get("board_id")
        if board_id:
            room = f"whiteboard_{board_id}"
            join_room(room)
            emit("whiteboard_user_joined", {"board_id": board_id, "user": data.get("user")}, to=room, include_self=False)

    @socketio.on("leave_whiteboard")
    def handle_leave_whiteboard(data):
        board_id = data.get("board_id")
        if board_id:
            room = f"whiteboard_{board_id}"
            leave_room(room)

    @socketio.on("whiteboard_draw_action")
    def handle_whiteboard_draw(data):
        board_id = data.get("board_id")
        action = data.get("action")  # element added, modified, removed
        element = data.get("element")
        if board_id:
            room = f"whiteboard_{board_id}"
            emit("whiteboard_updated", {
                "action": action,
                "element": element,
                "user": data.get("user")
            }, to=room, include_self=False)

    @socketio.on("whiteboard_clear")
    def handle_whiteboard_clear(data):
        board_id = data.get("board_id")
        if board_id:
            room = f"whiteboard_{board_id}"
            emit("whiteboard_cleared", {"board_id": board_id}, to=room, include_self=False)
