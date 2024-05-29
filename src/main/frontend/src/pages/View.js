import React, { useState, useEffect } from 'react';
import Navbar from "react-bootstrap/Navbar";
import { Container, Nav, Card, Spinner, Form, Button } from "react-bootstrap";
import {useParams, useNavigate, useLocation} from "react-router-dom";
import './Board.css';
import {responsivePropType} from "react-bootstrap/createUtilityClasses"; // 추가된 스타일 시트

const View = () => {
    const { id } = useParams();
    const location = useLocation(); // useLocation 훅을 사용하여 location 객체 가져오기
    const queryParams = new URLSearchParams(location.search);
    const memberId = queryParams.get('memberId'); // 쿼리 파라미터에서 memberId 가져오기
    const [role, setRole] = useState("");
    const [boardData, setBoardData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [comments, setComments] = useState(null);
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [newComment, setNewComment] = useState("")
    //해당 게시글 정보 가져오는 메소드
    useEffect(() => {
        fetch(`http://localhost:8080/board/${id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                const updateData = {...data, view: data.view+1};
                setBoardData(updateData);
                // 서버에 조회수 업데이트
                return fetch(`http://localhost:8080/viewCount/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                setLoading(false); // 데이터가 성공적으로 로드되면 로딩 상태를 false로 설정
            })
            .catch(error => {
                setError(error.message);
                setLoading(false); // 오류 발생 시 로딩 상태를 false로 설정
            });
    }, [id]);
    // 유저 권한 정보를 가져오는 메소드
    useEffect(() => {
        fetch(`http://localhost:8080/memberInfo/${memberId}`)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(text); });
                }
                return response.json();
            })
            .then(data => {
                setUserData(data);
                setRole(data.role); // 멤버 객체에서 역할 정보 설정
            })
            .catch(error => {
                setError(error.message);
                alert(error.message); // 오류 메시지를 알림으로 표시
            });
    }, [id]);
    // 댓글 업로드 api 요청하는 메소드
    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!userData) {
            alert('유저 정보를 가져오는 중입니다. 잠시만 기다려주세요.');
            return;
        }
        const postData = {
            postId: id,
            nickname: userData.nickname,
            createdAt: new Date().toISOString(),
            content: newComment,
        };
        // 서버에 새 댓글을 게시합니다
        fetch(`http://localhost:8080/postComment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify( postData ),
        })
            .then((response) => {
                if (response.status === 201 || response.status ===200) {
                    return response.text(); // JSON 대신 텍스트로 응답 처리
                } else {
                    return response.text().then(text => Promise.reject(text || '댓글 업로드에 실패하였습니다.'));
                }
            })
            .then((data) => {
                console.log(data);
                setNewComment(""); // 댓글 입력 필드 초기화
                navigate(`/ViewPost/${id}?memberId=${memberId}`);
            })
            .catch((error) => {
                console.error('Error:', error);
                alert(error);
            });
    };
    // 댓글 가져오는 메소드
    useEffect(() => {
        fetch(`http://localhost:8080/getComment/${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setComments(data);
            })
            .catch(error => {
                console.error('Error fetching comments:', error);
                setComments([]); // 오류가 발생해도 빈 배열로 설정하여 처리
            });
    }, [id,comments]);
    // 수정 요청하는 메소드
    const handleEdit = () => {
        // 수정 버튼 클릭 시 동작
        navigate(`/Post/${memberId}?postId=${id}`);
    };
    //삭제 요청하는 메소드
    const handleDelete = () => {
        // 삭제 버튼 클릭 시 동작
        if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
            fetch(`http://localhost:8080/delete/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(() => {
                    alert("게시글이 삭제되었습니다.");
                    navigate(`/Board/${memberId}`);
                })
                .catch(error => setError(error.message));
        }
    };

    return (
        <>
            <Navbar bg="dark" variant="dark">
                <Container>
                    <Navbar.Brand href={`/Home/${memberId}`}>KW 거래소📉</Navbar.Brand>
                    <Nav className="ml-auto">
                        <Nav.Link href={`/Home/${memberId}`}>홈 화면</Nav.Link>
                        <Nav.Link href={`/Trading/${memberId}`}>주식 구매</Nav.Link>
                        <Nav.Link href={`/Board/${memberId}`}>커뮤니티</Nav.Link>
                        <Nav.Link href={`/MyInfo/${memberId}`}>내 정보</Nav.Link>
                        <Nav.Link href={`/Post/${memberId}`}>게시글 작성</Nav.Link>
                    </Nav>
                </Container>
            </Navbar>
            <br />

            <div className="centered-container">
                {loading ? (
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : (
                    <Card className="mb-4 shadow-sm card-custom">
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    ✍️{boardData.nickname} <span
                                    style={{fontSize: '0.8em', color: 'gray'}}>
                                                        👁️{boardData.view}
                                    </span>
                                </div>
                                <div>
                                    {boardData.member.id === parseInt(memberId) && (
                                        <>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={handleEdit}>
                                                수정
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={handleDelete}>
                                                삭제
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <blockquote className="blockquote mb-0">
                                <strong>{boardData.title}</strong>
                                <br/>
                                <br/>
                                <span style={{fontSize: '0.8em'}}>{boardData.content}</span>
                            </blockquote>
                        </Card.Body>
                            <Form onSubmit={handleCommentSubmit}>
                                <Form.Group controlId="comment">
                                    <Form.Control
                                        type="text"
                                        placeholder="댓글을 입력해주세요"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="mb-2"
                                    />
                                </Form.Group>
                                <Button type="submit" variant="primary">선플 달기</Button>
                            </Form>
                                <div className="scrollable-card">
                                {comments.map((comment, index) => (
                                    <div key={index} >
                                        <strong>🙋{comment.nickname}</strong> <span
                                        style={{fontSize: '0.8em', color: 'gray', marginLeft: '10px'}}>
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                    </span>
                                        <p className="mb-1">{comment.content}</p>
                                        <br/>
                                    </div>
                                ))}
                                </div>
                    </Card>
                )}
            </div>
        </>
    );
}

export default View;
