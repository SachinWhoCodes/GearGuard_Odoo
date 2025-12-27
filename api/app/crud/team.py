from sqlalchemy.orm import Session

from app.models.team import Team


def list_teams(db: Session) -> list[Team]:
    return db.query(Team).order_by(Team.created_at.desc()).all()


def get(db: Session, team_id: str) -> Team | None:
    return db.query(Team).filter(Team.id == team_id).first()


def create(db: Session, name: str, member_ids: list[str]) -> Team:
    team = Team(name=name, member_ids=member_ids or [])
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


def update(db: Session, team: Team, name: str | None = None, member_ids: list[str] | None = None) -> Team:
    if name is not None:
        team.name = name
    if member_ids is not None:
        team.member_ids = member_ids
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


def delete(db: Session, team: Team) -> None:
    db.delete(team)
    db.commit()
