from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """
    A ViewSet that provides full CRUD for Task objects.

    list:   GET  /api/tasks/
    create: POST /api/tasks/
    retrieve: GET  /api/tasks/{id}/
    update: PUT  /api/tasks/{id}/
    partial_update: PATCH /api/tasks/{id}/
    destroy: DELETE /api/tasks/{id}/
    toggle: POST /api/tasks/{id}/toggle/   (custom action)
    """

    queryset         = Task.objects.all()
    serializer_class = TaskSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ['title', 'description']
    ordering_fields  = ['created_at', 'priority', 'completed']

    def get_queryset(self):
        qs = super().get_queryset()
        completed = self.request.query_params.get('completed')
        priority  = self.request.query_params.get('priority')
        if completed is not None:
            qs = qs.filter(completed=completed.lower() in ('true', '1', 'yes'))
        if priority:
            qs = qs.filter(priority=priority)
        return qs

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle the completed status of a task."""
        task = self.get_object()
        task.completed = not task.completed
        task.save()
        return Response(TaskSerializer(task).data)
