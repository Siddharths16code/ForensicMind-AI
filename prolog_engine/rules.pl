
:- dynamic event/2.
:- dynamic evidence_event/8.

% ==========================================
% ORIGINAL INVESTIGATION RULES
% ==========================================

% RULE 1: Complete suspicious chronological sequence

suspicious_sequence(T1, T2, T3, T4) :-
    event(login, T1),
    event(file_modified, T2),
    event(usb_connected, T3),
    event(file_transfer, T4),
    T1 < T2,
    T2 < T3,
    T3 < T4.


% RULE 2: Repeated login activity

repeated_login(T1, T2) :-
    event(login, T1),
    event(login, T2),
    T1 < T2.


% RULE 3: Repeated file modifications

repeated_file_modification(T1, T2) :-
    event(file_modified, T1),
    event(file_modified, T2),
    T1 < T2.


% RULE 4: USB followed by file transfer

usb_transfer_pattern(T1, T2) :-
    event(usb_connected, T1),
    event(file_transfer, T2),
    T1 < T2.


% RULE 5: File transfer without preceding USB event
% This only refers to the submitted evidence.

transfer_without_prior_usb(T) :-
    event(file_transfer, T),
    \+ (
        event(usb_connected, USBTime),
        USBTime < T
    ).


% ==========================================
% EVIDENCE INTELLIGENCE RULES
% evidence_event(
%   ID, EventType, Timestamp, Source,
%   Device, User, FileName, MetadataJSON
% )
% ==========================================


% RULE 6: Two different events share a device

same_device_activity(T1, T2, Type1, Type2, Device) :-
    evidence_event(_, Type1, T1, _, Device, _, _, _),
    evidence_event(_, Type2, T2, _, Device, _, _, _),
    Device \= "Unknown",
    Type1 \= Type2,
    T1 < T2.


% RULE 7: Two different events share a user

same_user_activity(T1, T2, Type1, Type2, User) :-
    evidence_event(_, Type1, T1, _, _, User, _, _),
    evidence_event(_, Type2, T2, _, _, User, _, _),
    User \= "Unknown",
    Type1 \= Type2,
    T1 < T2.


% RULE 8: Two different events refer to the same file

same_file_activity(T1, T2, Type1, Type2, File) :-
    evidence_event(_, Type1, T1, _, _, _, File, _),
    evidence_event(_, Type2, T2, _, _, _, File, _),
    File \= "Unknown",
    Type1 \= Type2,
    T1 < T2.


% ==========================================
% EXPLANATIONS
% ==========================================

explain(
    suspicious_sequence,
    'Login, file modification, USB connection and file transfer occurred in chronological order.'
).

explain(
    repeated_login,
    'Multiple login events were recorded in the supplied evidence.'
).

explain(
    repeated_file_modification,
    'Multiple file modification events were recorded.'
).

explain(
    usb_transfer_pattern,
    'A USB connection was followed by a file transfer event.'
).

explain(
    transfer_without_prior_usb,
    'A file transfer was recorded without a preceding USB connection event in the supplied evidence.'
).

explain(
    same_device_activity,
    'Multiple events are associated with the same identified device.'
).

explain(
    same_user_activity,
    'Multiple events are associated with the same identified user.'
).

explain(
    same_file_activity,
    'Multiple events refer to the same identified file.'
).
