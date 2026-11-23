% Sample forensic evidence

event(login, 2205).
event(file_modified, 2208).
event(usb_connected, 2210).
event(file_transfer, 2212).

% Suspicious sequence detection

suspicious_sequence :-
    event(login, T1),
    event(file_modified, T2),
    event(usb_connected, T3),
    event(file_transfer, T4),
    T1 < T2,
    T2 < T3,
    T3 < T4.