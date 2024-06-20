package com.example.todoapp;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;
import android.util.Log;

public class TodoAdapter extends RecyclerView.Adapter<TodoAdapter.TodoViewHolder> {
    private List<Task> tasks;
    private OnTaskLongClickListener longClickListener;

    public TodoAdapter(List<Task> tasks, OnTaskLongClickListener longClickListener) {
        this.tasks = tasks;
        this.longClickListener = longClickListener;
    }

    @NonNull
    @Override
    public TodoViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_task, parent, false);
        return new TodoViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull TodoViewHolder holder, int position) {
        Task task = tasks.get(position);
        holder.taskName.setText(task.getName());
        holder.taskStatus.setBackgroundResource(getStatusIndicator(task.getStatus()));


        holder.itemView.setOnLongClickListener(v -> {
            Log.d("TodoAdapter", "Task long clicked: " + task.getName());
            longClickListener.onTaskLongClicked(task);
            return true;
        });
    }

    private int getStatusIndicator(String status) {
        switch (status) {
            case "Todo":
                return R.drawable.todo_icon;
            case "In progress":
                return R.drawable.inprogress_icon;
            case "Done":
                return R.drawable.done_icon;
            case "Bug":
                return R.drawable.bug_icon;
            default:
                return R.drawable.default_icon;
        }
    }

    @Override
    public int getItemCount() {
        return tasks.size();
    }

    public interface OnTaskLongClickListener {
        void onTaskLongClicked(Task task);
    }

    public static class TodoViewHolder extends RecyclerView.ViewHolder {
        public TextView taskName;
        public TextView taskStatus;

        public TodoViewHolder(View itemView) {
            super(itemView);
            taskName = itemView.findViewById(R.id.taskName);
            taskStatus = itemView.findViewById(R.id.taskStatus);
        }
    }
}
